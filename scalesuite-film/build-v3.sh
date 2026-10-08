#!/usr/bin/env bash
# Build the ScaleSuite film V3 (V2's build.sh and outputs are left untouched).
#   ./build-v3.sh preview      → scenes 1–3 (0–8.5 s): 540×960 30 fps preview with sound + contact sheet
# Frames are rendered at 1080×1920 and downscaled (Chrome ignores a fractional deviceScaleFactor in
# screenshots). Output goes to ../brag-output (intermediates in ../brag-output/work-v3).
set -euo pipefail
cd "$(dirname "$0")"
MODE=${1:-preview}
END=${END:-8.5}
OUT=../brag-output
WORK=$OUT/work-v3
mkdir -p "$WORK" "$OUT/previews"

# ---- sound: cues exported from the GSAP timeline, synthesised, loudness-normalised (−15 LUFS)
node render/cues-v3.mjs > "$WORK/cues-v3.json"
python3 audio/music-v3.py --cues "$WORK/cues-v3.json" --end "$END" "$WORK/music-v3-raw.wav"
MEAS=$(ffmpeg -hide_banner -nostats -i "$WORK/music-v3-raw.wav" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' |
  python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -hide_banner -loglevel error -y -i "$WORK/music-v3-raw.wav" -af "loudnorm=I=-15:TP=-1.5:LRA=11:$MEAS:linear=true" -ar 48000 "$WORK/music-v3.wav"

if [ "$MODE" = preview ]; then
  TAG=v3-s1-3
  rm -rf "$WORK/frames-preview"
  node render/frames-v3.mjs --fps=30 --workers=4 --end="$END" --out="$WORK/frames-preview"
  ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$WORK/frames-preview/%05d.png" -i "$WORK/music-v3.wav" -map 0:v -map 1:a \
    -vf "scale=540:-2:flags=lanczos,format=yuv420p" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a aac -b:a 160k -movflags +faststart -shortest "$OUT/previews/scalesuite-preview-9x16-30fps-$TAG.mp4"
  rm -rf "$WORK/frames-preview"
  # contact sheet: a few frames per scene
  S1="0.00,0.60,1.20,2.00"
  S2="2.45,2.95,3.55,4.30,4.90,5.40"
  S3="5.62,6.20,6.75,7.50,8.20,8.50"
  rm -rf "$WORK/sheet" && mkdir -p "$WORK/sheet"
  ALL="" NAMES=""
  for s in 1 2 3; do V="S$s"; for t in $(echo "${!V}" | tr ',' ' '); do ALL="$ALL,$t"; NAMES="$NAMES,s$s-$t"; done; done
  node render/stills-v3.mjs --times="${ALL#,}" --names="${NAMES#,}" --out="$WORK/sheet"
  row() { local s=$1 v="S$1"; echo "$2|$(echo "${!v}" | tr ',' '\n' | sed "s#^#$WORK/sheet/s$s-#; s#\$#.png#" | paste -sd,)"; }
  python3 render/sheet-v3.py "$OUT/scalesuite-contact-sheet-$TAG.jpg" 300 \
    "$(row 1 'Scène 1 · Accroche (0–2,5 s)')" "$(row 2 'Scène 2 · Chaos (2,5–5,5 s)')" "$(row 3 'Scène 3 · Soulagement (5,5–8,5 s)')"
fi
echo "done: $MODE v3"
