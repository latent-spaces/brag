#!/usr/bin/env python3
"""Self-check for skills/promo/scripts/footage.py on synthetic phone-like media.

Run: python3 tests/test_footage.py   (needs ffmpeg with libx265 + zscale, ImageMagick 6 or 7)
"""
import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "skills/promo/scripts"
sys.path.insert(0, str(SCRIPTS))
from footage import im, run  # noqa: E402

MUSIC = sorted((ROOT / "skills/promo/assets/music").glob("*.mp3"))[0]
MUSIC12 = next((ROOT / "skills/promo/assets/music").glob("*vol-12-*.mp3"))


def ff(*args):
    run(["ffmpeg", "-y", "-v", "error", *args])


def cli(*args, ok=True):
    r = subprocess.run([sys.executable, SCRIPTS / "footage.py", *map(str, args)], capture_output=True, text=True)
    assert (r.returncode == 0) == ok, r.stderr
    return r.stdout if ok else r.stderr


def dims(img):
    return tuple(int(v) for v in run(im("identify", "-format", "%w %h", img)).split())


def exif_rotated_jpeg(dst):
    """400x300 JPEG whose EXIF orientation is 6 (rotate 90° CW), so it displays as 300x400."""
    base = dst.with_suffix(".base.jpg")
    run(im("convert", "-size", "400x300", "gradient:green-yellow", base))
    tiff = b"MM\x00*\x00\x00\x00\x08" + struct.pack(">H", 1) + struct.pack(">HHIHH", 0x0112, 3, 1, 6, 0) + b"\0\0\0\0"
    app1 = b"Exif\0\0" + tiff
    data = base.read_bytes()
    dst.write_bytes(data[:2] + b"\xff\xe1" + struct.pack(">H", len(app1) + 2) + app1 + data[2:])


def main():
    import footage
    # contact-sheet picks: the frame at the cut (round, not truncate), and the opening frame always kept
    expr = footage.sheet_frames({"fps": 30, "duration": 4}, [3.63])
    assert "eq(n,109)" in expr and "eq(n,0)" in expr, expr
    expr = footage.sheet_frames({"fps": 30, "duration": 4}, [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4])
    assert "eq(n,0)" in expr, expr
    # frame-rate passthrough flag that exists on both old and new ffmpeg
    assert footage.passthrough((4, 4)) == ["-vsync", "0"]
    assert footage.passthrough((5, 1)) == ["-fps_mode:v:0", "passthrough"]
    assert footage.passthrough((8, 1)) == ["-fps_mode:v:0", "passthrough"]

    # dot-prefixed on purpose: real media folders can sit under ~/.cache, ~/.local, etc.
    with tempfile.TemporaryDirectory(prefix=".promo-test-") as tmp:
        d = Path(tmp)
        # Fixtures shaped like phone media, named the way phones and messengers name them.
        hdr = d / "کلیپ اچ دی آر.mov"  # HLG HEVC 10-bit, landscape, with audio
        ff("-f", "lavfi", "-i", "testsrc2=size=1920x1080:rate=30:duration=3", "-f", "lavfi", "-i", "sine=f=440:d=3",
           "-c:v", "libx265", "-pix_fmt", "yuv420p10le",
           "-x265-params", "log-level=error:colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc",
           "-color_primaries", "bt2020", "-color_trc", "arib-std-b67", "-colorspace", "bt2020nc", "-c:a", "aac", hdr)
        raw = d / "raw.mp4"
        ff("-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=60:duration=2", "-c:v", "libx264", raw)
        rot = d / "portrait 60fps.mp4"  # stored landscape + rotation flag = phone held upright; no audio
        ff("-i", raw, "-c", "copy", "-metadata:s:v:0", "rotate=90", rot)  # ffmpeg 5.1 keeps the flag only on stream copy
        heic = d / "عکس ۱.heic"
        run(im("convert", "-size", "400x300", "gradient:red-blue", heic))
        tilted = d / "tilted.jpg"
        exif_rotated_jpeg(tilted)
        broken = d / "broken.mp4"
        broken.write_bytes(hdr.read_bytes()[:2000])
        # iPhone photos carry a wide-gamut profile (Display P3); this AdobeRGB-tagged green stands in for one:
        # its stored numbers are not sRGB, so a still that only strips the profile would come out wrong
        wide = d / "wide gamut.jpg"
        icc = Path("/usr/share/color/icc/compatibleWithAdobeRGB1998.icc")
        srgb = Path("/usr/share/color/icc/sRGB.icc")
        run(im("convert", "-size", "64x48", "xc:rgb(0,255,0)", "-profile", srgb, "-profile", icc, wide))
        pct = d / "sale 50% off %d.jpg"  # ImageMagick would read %d as a frame-number pattern
        run(im("convert", "-define", "filename:literal=true", "-size", "40x30", "xc:red", pct))
        bmp = d / "scan.bmp"
        run(im("convert", "-size", "40x30", "xc:blue", bmp))
        cut = d / "hard cut.mts"  # MPEG-TS camcorder extension; red for 1s, then blue for 1s
        ff("-f", "lavfi", "-i", "color=c=red:size=320x240:rate=30:duration=1", "-f", "lavfi", "-i",
           "color=c=blue:size=320x240:rate=30:duration=1", "-filter_complex", "[0][1]concat=n=2:v=1[v]",
           "-map", "[v]", "-c:v", "libx264", "-f", "mpegts", cut)
        junk = d / "._IMG_0001.heic"  # macOS AppleDouble sidecar: media extension, not media
        junk.write_bytes(b"\0\5\26\7")
        old = d / "promo-output" / "promo.mp4"  # an earlier run's output inside the media folder
        old.parent.mkdir()
        old.write_bytes(hdr.read_bytes())

        # prep: manifest, upright stills, contact sheets; a broken file is flagged, not fatal; junk skipped
        work = d / "work"
        cli("prep", work, hdr, rot, heic, tilted, broken, junk, old, wide, pct, bmp, cut)
        m = [json.loads(line) for line in (work / "manifest.jsonl").read_text().splitlines()]
        assert [x["index"] for x in m] == [1, 2, 3, 4, 5, 6, 7, 8, 9], m
        assert m[6]["kind"] == "photo" and "error" not in m[6], m[6]  # '%d' in the name
        assert m[7]["kind"] == "photo" and m[8]["kind"] == "video", (m[7], m[8])
        assert any(abs(c - 1.0) < 0.1 for c in m[8]["cuts"]), m[8]  # scene cut reported for picking in/out points
        if icc.exists() and srgb.exists():
            g = run(im("convert", work / "stills/006.jpg", "-format", "%[fx:int(255*p{32,24}.r)] %[fx:int(255*p{32,24}.g)] %[fx:int(255*p{32,24}.b)]", "info:")).split()
            assert int(g[0]) < 30 and int(g[1]) > 225 and int(g[2]) < 30, g  # converted back to sRGB green, not stripped
        assert m[0]["kind"] == "video" and m[0]["hdr"] and m[0]["has_audio"], m[0]
        assert (m[1]["width"], m[1]["height"], m[1]["fps"], m[1]["has_audio"]) == (720, 1280, 60, False), m[1]
        assert (m[2]["width"], m[2]["height"]) == (400, 300), m[2]
        assert (m[3]["width"], m[3]["height"]) == (300, 400), m[3]
        assert "error" in m[4] and m[4]["kind"] == "video", m[4]
        assert dims(work / "stills/003.jpg") == (400, 300)
        assert dims(work / "stills/004.jpg") == (300, 400)
        for sheet in ("photos-01.jpg", "video-001.jpg", "video-002.jpg"):
            assert (work / "sheets" / sheet).exists(), sheet

        # skip rules are relative to the media folder: an ancestor named promo-output-* is fine,
        # a hidden subfolder inside it (DCIM/.thumbnails) is not; nothing usable left is an error
        arch = d / "promo-output-archive" / "cafe"
        (arch / "DCIM" / ".thumbnails").mkdir(parents=True)
        for name in ("a.jpg", "b.jpg", "DCIM/.thumbnails/t.jpg"):
            run(im("convert", "-size", "20x20", "xc:white", arch / name))
        cli("prep", d / "w2", arch / "a.jpg", arch / "b.jpg", arch / "DCIM/.thumbnails/t.jpg")
        assert len((d / "w2" / "manifest.jsonl").read_text().splitlines()) == 2
        assert "nothing" in cli("prep", d / "w3", junk, ok=False)
        rel = os.path.relpath(arch / "a.jpg")  # '../../tmp/...' from the test's working directory
        cli("prep", d / "w4", rel, arch / "b.jpg")
        assert len((d / "w4" / "manifest.jsonl").read_text().splitlines()) == 2

        # shot: exact frame count at 30fps, target size, upright, HDR tone-mapped without error
        assert cli("shot", hdr, 0.5, 2, "1080x1920", 0.3, work / "frames/a").split()[0] == "60"
        a = sorted((work / "frames/a").glob("*.jpg"))
        assert len(a) == 60 and dims(a[0]) == (1080, 1920)
        # upright: a red band on the stored frame's left edge must land where ffmpeg's own decode puts it
        banded = d / "banded.mp4"
        ff("-f", "lavfi", "-i", "color=c=gray:size=1280x720:rate=30:duration=1", "-vf", "drawbox=x=0:y=0:w=160:h=720:color=red:t=fill",
           "-c:v", "libx264", d / "banded-raw.mp4")
        ff("-i", d / "banded-raw.mp4", "-c", "copy", "-metadata:s:v:0", "rotate=90", banded)
        ref = d / "ref.png"
        ff("-i", banded, "-frames:v", "1", "-vf", "scale=1080:1920", ref)
        cli("shot", banded, 0, 0.5, "1080x1920", 0.5, work / "frames/band")
        red = lambda img, x, y: int(run(im("convert", img, "-format", f"%[fx:int(255*p{{{x},{y}}}.r)]", "info:")))
        for x, y in ((540, 40), (540, 1880), (40, 960), (1040, 960)):
            assert (red(ref, x, y) > 200) == (red(work / "frames/band/00001.jpg", x, y) > 200), (x, y)
        cli("shot", rot, 0, 1.5, "1080x1920", 0.5, work / "frames/b")
        b = sorted((work / "frames/b").glob("*.jpg"))
        assert len(b) == 45 and dims(b[0]) == (1080, 1920), len(b)
        assert "past the end" in cli("shot", rot, 1.5, 2, "1080x1920", 0.5, work / "frames/c", ok=False)
        # a folder named like a promo ("50% off") must work, and shot must never delete or count other JPGs
        pct = d / "50% off" / "frames"
        pct.mkdir(parents=True)
        (pct / "keep me.jpg").write_bytes(b"not a frame")
        cli("shot", rot, 0, 1, "1080x1920", 0.5, pct)
        assert (pct / "keep me.jpg").exists() and len(list(pct.glob("[0-9][0-9][0-9][0-9][0-9].jpg"))) == 30
        assert "cx" in cli("shot", rot, 0, 1, "1080x1920", 1.5, work / "frames/d", ok=False)

        # encode: 6s of frames + 4s of music -> exactly 6s / 180 frames, audio present, about -14 LUFS
        frames = work / "out"
        frames.mkdir()
        ff("-f", "lavfi", "-i", "testsrc2=size=1080x1920:rate=30:duration=6", "-start_number", "0", frames / "%05d.png")
        ff("-ss", "30", "-i", MUSIC, "-t", "4", work / "mix.wav")
        mp4 = work / "promo.mp4"
        cli("encode", frames, work / "mix.wav", mp4)
        s = json.loads(run(["ffprobe", "-v", "error", "-count_frames", "-of", "json", "-show_streams", "-show_format", mp4]))
        v = next(x for x in s["streams"] if x["codec_type"] == "video")
        assert (v["codec_name"], v["pix_fmt"], v["width"], v["height"], v["nb_read_frames"]) == \
            ("h264", "yuv420p", 1080, 1920, "180"), v
        assert any(x["codec_type"] == "audio" for x in s["streams"]), s["streams"]
        assert abs(float(s["format"]["duration"]) - 6) < 0.1, s["format"]["duration"]
        # loudness: a soft intro that lifts (like a real promo bed) drifts ~0.5 LU with one-pass
        # loudnorm; encode must land on -14 LUFS
        small = work / "small"
        small.mkdir()
        # 30s of the bed: long enough for AAC to overshoot a -2 dBTP target (as it did on a real 46s promo)
        ff("-f", "lavfi", "-i", "color=c=gray:size=160x284:rate=30:duration=30", "-start_number", "0", small / "%05d.png")
        ff("-t", "30", "-i", MUSIC12, "-af", "afade=t=out:st=29:d=1", work / "bed.wav")
        cli("encode", small, work / "bed.wav", work / "loud.mp4")
        loud = subprocess.run(["ffmpeg", "-nostats", "-i", work / "loud.mp4", "-af", "ebur128", "-f", "null", "-"],
                              capture_output=True, text=True).stderr
        lufs = float(loud.rsplit("I:", 1)[1].split()[0])
        assert abs(lufs + 14) < 0.35, lufs
        tp = subprocess.run(["ffmpeg", "-nostats", "-i", work / "loud.mp4", "-af", "ebur128=peak=true", "-f", "null", "-"],
                            capture_output=True, text=True).stderr
        peak = float(tp.rsplit("Peak:", 1)[1].split()[0])
        assert peak <= -1.5, peak  # true peak after AAC, not just before it
        # JPEG frames (what capture.mjs writes) encode the same way
        jpgs = work / "outjpg"
        jpgs.mkdir()
        ff("-f", "lavfi", "-i", "testsrc2=size=1080x1920:rate=30:duration=3", "-start_number", "0", "-q:v", "2", jpgs / "%05d.jpg")
        cli("encode", jpgs, work / "mix.wav", work / "fromjpg.mp4")
        s = json.loads(run(["ffprobe", "-v", "error", "-count_frames", "-of", "json", "-show_streams", work / "fromjpg.mp4"]))
        assert next(x for x in s["streams"] if x["codec_type"] == "video")["nb_read_frames"] == "90", s["streams"]
        # "none" still writes a (silent) audio track: players like Telegram treat track-less MP4s as GIFs
        cli("encode", frames, "none", work / "silent.mp4")
        s = json.loads(run(["ffprobe", "-v", "error", "-of", "json", "-show_streams", work / "silent.mp4"]))
        assert sorted(x["codec_type"] for x in s["streams"]) == ["audio", "video"], s["streams"]

        # tagged BT.709 end to end, colours intact, and the poster embedded as cover art
        reds = work / "reds"
        reds.mkdir()
        ff("-f", "lavfi", "-i", "color=c=red:size=320x568:rate=30:duration=1", "-start_number", "0", reds / "%05d.png")
        cli("encode", reds, "none", work / "red.mp4", "--poster", work / "stills/004.jpg")
        s = json.loads(run(["ffprobe", "-v", "error", "-of", "json", "-show_streams", work / "red.mp4"]))
        v = s["streams"][0]
        assert (v.get("color_space"), v.get("color_primaries"), v.get("color_transfer")) == ("bt709", "bt709", "bt709"), v
        assert any(x.get("disposition", {}).get("attached_pic") for x in s["streams"]), s["streams"]
        px = subprocess.run(["ffmpeg", "-v", "error", "-i", work / "red.mp4", "-map", "0:v:0", "-frames:v", "1", "-vf", "crop=2:2:100:100",  # a crop keeps the colour tags; a 1x1 scale does not
                            
                             "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        r_, g_, b_ = px[:3]
        assert r_ > 230 and g_ < 30 and b_ < 30, (r_, g_, b_)

        mid = work / "mid"
        mid.mkdir()
        ff("-f", "lavfi", "-i", "color=c=0xC87828:size=320x568:rate=30:duration=1", "-start_number", "0", mid / "%05d.png")
        cli("encode", mid, "none", work / "mid.mp4")
        px = subprocess.run(["ffmpeg", "-v", "error", "-i", work / "mid.mp4", "-map", "0:v:0", "-frames:v", "1", "-vf", "crop=2:2:100:100",  # a crop keeps the colour tags; a 1x1 scale does not
                            
                             "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        assert all(abs(x - y) <= 5 for x, y in zip(px[:3], (200, 120, 40))), tuple(px[:3])  # BT.709 matrix, not BT.601

        # encode refuses frame folders that would silently give a wrong video
        mixed = work / "mixed"
        shutil.copytree(jpgs, mixed)
        shutil.copy(frames / "00000.png", mixed / "00000.png")
        assert "mixes" in cli("encode", mixed, "none", work / "x.mp4", ok=False)
        gap = work / "gap"
        shutil.copytree(jpgs, gap)
        (gap / "00015.jpg").unlink()
        assert "gap" in cli("encode", gap, "none", work / "x.mp4", ok=False)
        fake = work / "fake"
        shutil.copytree(jpgs, fake)
        shutil.copy(frames / "00000.png", fake / "00000.jpg")  # PNG bytes under a .jpg name
        assert "frames" in cli("encode", fake, "none", work / "x.mp4", ok=False)
        # and it works from a path with '%' in it
        pctf = d / "50% off" / "out"
        shutil.copytree(jpgs, pctf)
        cli("encode", pctf, work / "mix.wav", d / "50% off" / "promo.mp4")
    print("footage.py: all checks passed")


if __name__ == "__main__":
    main()
