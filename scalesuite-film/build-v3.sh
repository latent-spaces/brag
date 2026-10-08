#!/usr/bin/env bash
# Build the ScaleSuite film V3 (V2's build.sh and outputs are left untouched).
#   ./build-v3.sh preview        → whole film: 540×960 30 fps preview with sound + contact sheet (one row per scene)
#   END=8.5 ./build-v3.sh preview → the same for 0–END only (scenes 1–3 review)
#   ./build-v3.sh final          → 1080×1920 60 fps master, H.264/yuv420p/faststart, poster frame 0, audio stems
# Frames are rendered at 1080×1920 (Chrome ignores a fractional deviceScaleFactor in screenshots) and
# downscaled for the preview. Output goes to ../brag-output (intermediates in ../brag-output/work-v3).
set -euo pipefail
cd "$(dirname "$0")"
MODE=${1:-preview}
OUT=../brag-output
WORK=$OUT/work-v3
mkdir -p "$WORK" "$OUT/previews"
node render/cues-v3.mjs > "$WORK/cues-v3.json"
FULL=$(python3 -c "import json;print(json.load(open('$WORK/cues-v3.json'))['duration'])")
END=${END:-$FULL}
TAG=$([ "$END" = "$FULL" ] && echo v3 || echo v3-s1-3)

# ---- sound: cues exported from the GSAP timeline, synthesised, loudness-normalised (−15 LUFS)
python3 audio/music-v3.py --cues "$WORK/cues-v3.json" --end "$END" "$WORK/music-$TAG-raw.wav" --stems "$WORK/stems-$TAG"
MEAS=$(ffmpeg -hide_banner -nostats -i "$WORK/music-$TAG-raw.wav" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' |
  python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -hide_banner -loglevel error -y -i "$WORK/music-$TAG-raw.wav" -af "loudnorm=I=-15:TP=-1.5:LRA=11:$MEAS:linear=true" -ar 48000 "$WORK/music-$TAG.wav"
TRACK="$WORK/music-$TAG.wav"

if [ "$MODE" = preview ]; then
  rm -rf "$WORK/frames-preview"
  node render/frames-v3.mjs --fps=30 --workers=4 --end="$END" --out="$WORK/frames-preview"
  ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$WORK/frames-preview/%05d.png" -i "$TRACK" -map 0:v -map 1:a \
    -vf "scale=540:-2:flags=lanczos,format=yuv420p" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a aac -b:a 160k -movflags +faststart -shortest "$OUT/previews/scalesuite-preview-9x16-30fps-$TAG.mp4"
  rm -rf "$WORK/frames-preview"
  # contact sheet: a few frames per scene, one row per scene
  ROWS=(
    "Scène 1 · Accroche (0–2,5 s)|0.00,0.60,1.20,2.00"
    "Scène 2 · Chaos (2,5–5,5 s)|2.45,2.95,3.55,4.30,4.90,5.40"
    "Scène 3 · Soulagement (5,5–8,5 s)|5.62,6.20,6.75,7.50,8.20,8.50"
    "Scène 4 · Une seule structure (8,5–11 s)|8.80,9.40,10.10,10.55,10.90"
    "Scène 5 · Créées. (11–14 s)|11.30,11.90,12.50,13.10,13.45,13.80"
    "Scène 6 · Suivies. (14–16 s)|14.20,14.60,15.05,15.40,15.80"
    "Scène 7 · Optimisées. (16–18 s)|16.20,16.70,17.10,17.45,17.80"
    "Scène 8 · Le lead (18–25 s)|18.50,19.20,19.60,20.20,20.75,21.20,21.95,22.35,22.70,23.40,24.80"
    "Scène 9 · Thèse (25–27 s)|25.10,25.60,26.40,26.95"
    "Scène 10 · Appel à l'action (27–31 s)|27.30,27.80,28.30,28.80,30.90"
  )
  ALL="" NAMES="" ARGS=()
  for i in "${!ROWS[@]}"; do
    s=$((i + 1)); title="${ROWS[$i]%%|*}"; times="${ROWS[$i]#*|}"; files=""
    for t in ${times//,/ }; do
      if awk "BEGIN{exit !($t <= $END)}"; then ALL="$ALL,$t"; NAMES="$NAMES,s$s-$t"; files="$files,$WORK/sheet/s$s-$t.png"; fi
    done
    [ -n "$files" ] && ARGS+=("$title|${files#,}")
  done
  rm -rf "$WORK/sheet" && mkdir -p "$WORK/sheet"
  node render/stills-v3.mjs --times="${ALL#,}" --names="${NAMES#,}" --out="$WORK/sheet"
  python3 render/sheet-v3.py "$OUT/scalesuite-contact-sheet-$TAG.jpg" "$([ "$TAG" = v3 ] && echo 200 || echo 300)" "${ARGS[@]}"
else
  # master: 60 fps, frame 0 = settled hook (platform thumbnail), poster JPEG, stems for a voiceover mix
  node render/stills-v3.mjs --times=2.0 --names=poster-9x16-v3 --out="$WORK"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/poster-9x16-v3.png" -q:v 2 "$OUT/scalesuite-preview-v3.jpg"
  rm -rf "$WORK/frames-final"
  node render/frames-v3.mjs --fps=60 --workers=4 --poster --out="$WORK/frames-final"
  ffmpeg -hide_banner -loglevel error -y -framerate 60 -i "$WORK/frames-final/%05d.png" -i "$TRACK" \
    -map 0:v -map 1:a -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
    -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 -pix_fmt yuv420p \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$OUT/scalesuite-social-9x16-v3.mp4"
  rm -rf "$WORK/frames-final"
  mkdir -p "$OUT/audio-v3"
  for s in bed sfx; do ffmpeg -hide_banner -loglevel error -y -i "$WORK/stems-$TAG/$s.wav" -c:a flac "$OUT/audio-v3/$s.flac"; done
  ffmpeg -hide_banner -loglevel error -y -i "$TRACK" -c:a flac "$OUT/audio-v3/music-v3.flac"
fi
echo "done: $MODE $TAG"
