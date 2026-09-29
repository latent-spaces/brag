#!/usr/bin/env bash
# Build the ScaleSuite film.
#   ./build.sh preview   → low-res 30 fps previews of both formats (+ contact sheets)
#   ./build.sh final     → 1080×1920 and 1080×1350, 60 fps, H.264/yuv420p/faststart, with audio
# Output goes to ../brag-output (intermediates in ../brag-output/work).
set -euo pipefail
cd "$(dirname "$0")"
MODE=${1:-preview}
OUT=../brag-output
WORK=$OUT/work
mkdir -p "$WORK/audio"

# ---- soundtrack (synthesised, then two-pass loudness normalisation to −15 LUFS / −1.5 dBTP)
python3 audio/music.py "$WORK/audio/music-raw.wav"
MEAS=$(ffmpeg -hide_banner -nostats -i "$WORK/audio/music-raw.wav" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' |
  python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -hide_banner -loglevel error -y -i "$WORK/audio/music-raw.wav" -af "loudnorm=I=-15:TP=-1.5:LRA=11:$MEAS:linear=true" -ar 48000 "$WORK/audio/music.wav"

encode() { # frames_dir fps out crf
  ffmpeg -hide_banner -loglevel error -y -framerate "$2" -i "$1/%05d.png" -i "$WORK/audio/music.wav" \
    -map 0:v -map 1:a -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
    -c:v libx264 -preset slow -crf "$4" -profile:v high -level 4.2 -pix_fmt yuv420p \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$3"
}

if [ "$MODE" = preview ]; then
  for F in vertical feed; do
    rm -rf "$WORK/frames-$F-preview"
    node render/frames.mjs --format=$F --fps=30 --scale=0.5 --workers=4 --out="$WORK/frames-$F-preview"
    encode "$WORK/frames-$F-preview" 30 "$WORK/preview-$F.mp4" 22
  done
else
  node render/stills.mjs --format=vertical --times=2.3 --names=poster-9x16 --out="$WORK"
  node render/stills.mjs --format=feed --times=2.3 --names=poster-4x5 --out="$WORK"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/poster-9x16.png" -q:v 2 "$OUT/scalesuite-preview.jpg"
  for F in vertical feed; do
    NAME=$([ $F = vertical ] && echo scalesuite-social-9x16 || echo scalesuite-linkedin-4x5)
    rm -rf "$WORK/frames-$F"
    node render/frames.mjs --format=$F --fps=60 --scale=1 --workers=4 --poster --out="$WORK/frames-$F"
    encode "$WORK/frames-$F" 60 "$OUT/$NAME.mp4" 16
  done
fi
echo "done: $MODE"
