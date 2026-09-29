#!/usr/bin/env bash
# Build the ScaleSuite film.
#   ./build.sh preview [v2|v1]   → 30 fps review renders of both formats (+ contact sheets)
#   ./build.sh final   [v2|v1]   → 1080×1920 and 1080×1350, 60 fps, H.264/yuv420p/faststart, with audio
#   VO=voice.wav ./build.sh final v2   → same, with the voiceover mixed in (music ducked under speech)
# V2 (default) = V1 animation + reading holds from src/timemap.js. V1 outputs keep their original names.
# Output goes to ../brag-output (intermediates in ../brag-output/work).
set -euo pipefail
cd "$(dirname "$0")"
MODE=${1:-preview}
VER=${2:-v2}
OUT=../brag-output
WORK=$OUT/work
A="$WORK/audio"
mkdir -p "$A"
SUF=$([ "$VER" = v1 ] && echo "" || echo "-$VER")
VFLAG=$([ "$VER" = v1 ] && echo 1 || echo 2)

# ---- soundtrack: synthesised on the version's clock, stems kept for the voiceover mix
python3 audio/music.py "$A/music$SUF-raw.wav" $([ "$VER" = v1 ] && echo --v1) --stems "$A/stems$SUF"
MEAS=$(ffmpeg -hide_banner -nostats -i "$A/music$SUF-raw.wav" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' |
  python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -hide_banner -loglevel error -y -i "$A/music$SUF-raw.wav" -af "loudnorm=I=-15:TP=-1.5:LRA=11:$MEAS:linear=true" -ar 48000 "$A/music$SUF.wav"
TRACK="$A/music$SUF.wav"
if [ -n "${VO:-}" ]; then
  python3 audio/mix_vo.py --vo "$VO" --stems "$A/stems$SUF" --out "$A/mix-vo$SUF.wav"
  TRACK="$A/mix-vo$SUF.wav"
fi

encode() { # frames_dir fps out crf
  ffmpeg -hide_banner -loglevel error -y -framerate "$2" -i "$1/%05d.png" -i "$TRACK" \
    -map 0:v -map 1:a -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
    -c:v libx264 -preset slow -crf "$4" -profile:v high -level 4.2 -pix_fmt yuv420p \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$3"
}

if [ "$MODE" = preview ]; then
  mkdir -p "$OUT/previews"
  for F in vertical feed; do
    TAG=$([ $F = vertical ] && echo 9x16 || echo 4x5)
    rm -rf "$WORK/frames-$F-preview"
    node render/frames.mjs --v=$VFLAG --format=$F --fps=30 --workers=4 --out="$WORK/frames-$F-preview"
    # 540-wide review copy
    ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$WORK/frames-$F-preview/%05d.png" -i "$TRACK" -map 0:v -map 1:a \
      -vf "scale=540:-2:flags=lanczos,format=yuv420p" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
      -c:a aac -b:a 128k -movflags +faststart -shortest "$OUT/previews/scalesuite-preview-$TAG-30fps$SUF.mp4"
    rm -rf "$WORK/frames-$F-preview"
  done
else
  POSTER_T=$(node -e "global.window={};global.location={search:'?v=$VFLAG'};global.SS=window.SS={};require('./src/timemap.js');console.log(SS.toFilm(2.2))")
  node render/stills.mjs --v=$VFLAG --format=vertical --times=$POSTER_T --names=poster-9x16$SUF --out="$WORK"
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/poster-9x16$SUF.png" -q:v 2 "$OUT/scalesuite-preview$SUF.jpg"
  for F in vertical feed; do
    NAME=$([ $F = vertical ] && echo scalesuite-social-9x16 || echo scalesuite-linkedin-4x5)$SUF
    rm -rf "$WORK/frames-$F"
    node render/frames.mjs --v=$VFLAG --format=$F --fps=60 --workers=4 --poster --out="$WORK/frames-$F"
    encode "$WORK/frames-$F" 60 "$OUT/$NAME.mp4" 16
    rm -rf "$WORK/frames-$F"
  done
fi
echo "done: $MODE $VER"
