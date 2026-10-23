"""Export a Hyperframes/brag video's audio as separate stems plus the baked two-track mix.

usage: python3 export_stems.py <output_dir> [--video brag.mp4]

<output_dir> is a brag output folder holding composition/index.html and the rendered video.
Writes <output_dir>/stems/:
  dialogue.wav  music.wav  sfx.wav   unprocessed, 24-bit/48k stereo, full length, all start at 0:00
  mix.wav                             the two-track audio exactly as baked into the video
  README.txt                          clip list, timings, and loudness of each file
"""
import argparse, html, json, os, re, subprocess

ap = argparse.ArgumentParser()
ap.add_argument("output_dir")
ap.add_argument("--video", default="brag.mp4")
args = ap.parse_args()

comp = os.path.join(args.output_dir, "composition")
out = os.path.join(args.output_dir, "stems")
os.makedirs(out, exist_ok=True)
src = open(os.path.join(comp, "index.html")).read()
total = float(re.search(r'id="root"[^>]*data-duration="([\d.]+)"', src).group(1))

clips = []
for m in re.finditer(r"<audio\b([^>]*)>", src):
    a = m.group(1)
    g = lambda k: (re.search(k + r'="([^"]*)"', a) or [None, None])[1]
    auto = re.search(r"data-automation='([^']*)'", a)
    clips.append({
        "id": g("id") or "", "src": g("src"), "start": float(g("data-start") or 0),
        "dur": float(g("data-duration") or total), "vol": float(g("data-volume") or 1),
        "auto": json.loads(html.unescape(auto.group(1))) if auto else None,
    })


def stem_of(c):
    # asset folder first (assets/vo, assets/sfx, assets/music), then the id prefix
    path = (c["src"] or "").lower()
    for key, stem in (("/vo/", "dialogue"), ("/voice", "dialogue"), ("/sfx/", "sfx"), ("/music/", "music")):
        if key in path:
            return stem
    if c["id"].startswith("vo"):
        return "dialogue"
    if c["id"].startswith("sfx"):
        return "sfx"
    return "music"


def auto_expr(points, offset):
    # piecewise-linear volume over clip-local time t (global time = t + offset)
    pts = [(p["t"] - offset, p["v"]) for p in points]
    expr = str(pts[-1][1])
    for (t0, v0), (t1, v1) in reversed(list(zip(pts, pts[1:]))):
        seg = f"({v0}+({v1}-{v0})*(t-{t0})/{max(t1 - t0, 1e-6)})"
        expr = f"if(between(t,{t0},{t1}),{seg},{expr})"
    return f"if(lt(t,{pts[0][0]}),{pts[0][1]},{expr})"


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    i = re.findall(r"^\s+I:\s+(-?[\d.]+|-inf) LUFS", r, re.M)
    p = re.findall(r"^\s+Peak:\s+(-?[\d.]+|-inf) dBFS", r, re.M)
    return f"{i[-1] if i else '?'} LUFS, true peak {p[-1] if p else '?'} dBFS"


notes = []
for stem in ("dialogue", "music", "sfx"):
    group = [c for c in clips if stem_of(c) == stem]
    dest = os.path.join(out, f"{stem}.wav")
    cmd = ["ffmpeg", "-loglevel", "error", "-y"]
    if not group:  # keep the set complete: a silent full-length stem
        cmd += ["-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo", "-t", str(total), "-c:a", "pcm_s24le", dest]
        subprocess.run(cmd, check=True)
        notes.append(f"{stem}.wav: silent (no clips)")
        continue
    filt, labels = [], []
    for i, c in enumerate(group):
        cmd += ["-i", os.path.join(comp, c["src"])]
        chain = f"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{c['dur']},asetpts=PTS-STARTPTS"
        if c["auto"]:
            chain += f",volume='{auto_expr(c['auto']['lanes'][0]['points'], c['start'])}':eval=frame"
        chain += f",volume={c['vol']},adelay={int(round(c['start'] * 1000))}:all=1[a{i}]"
        filt.append(chain)
        labels.append(f"[a{i}]")
    filt.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:dropout_transition=0,apad,atrim=0:{total}[out]")
    cmd += ["-filter_complex", ";".join(filt), "-map", "[out]", "-c:a", "pcm_s24le", "-ar", "48000", dest]
    subprocess.run(cmd, check=True)
    notes.append(f"{stem}.wav: {len(group)} clip(s), {loudness(dest)}")
    for c in group:
        notes.append(f"    {c['start']:7.2f}s  {c['dur']:5.2f}s  vol {c['vol']}{' +automation' if c['auto'] else ''}  {c['src']}")

video = os.path.join(args.output_dir, args.video)
if os.path.exists(video):
    mix = os.path.join(out, "mix.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", video, "-vn", "-c:a", "pcm_s24le", "-ar", "48000", mix], check=True)
    notes.append(f"mix.wav: two-track audio baked into {args.video}, {loudness(mix)}")
else:
    notes.append(f"mix.wav: skipped ({args.video} not found)")

with open(os.path.join(out, "README.txt"), "w") as f:
    f.write(f"Stems for {os.path.basename(os.path.abspath(args.output_dir))} ({total}s)\n"
            "All files are 48 kHz stereo 24-bit WAV, full length, starting at 0:00; drop them at the timeline start.\n"
            "Stems are unprocessed at composition levels (music ducking included). If the final mix was\n"
            "loudness-normalized or limited, the stems summed will be quieter than mix.wav; add a master limiter.\n\n")
    f.write("\n".join(notes) + "\n")
print("\n".join(notes))
