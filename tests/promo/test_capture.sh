#!/usr/bin/env bash
# Self-check for skills/promo/scripts/capture.mjs: parallel JPG frames land at the right index.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
IM=$(command -v magick >/dev/null && echo "magick" || echo "convert")  # ImageMagick 7 or 6
t=$(mktemp -d); trap 'rm -rf "$t"' EXIT
w="$t/job #2"  # '#' would end a file:// URL early if the path isn't encoded
mkdir -p "$w/out"
cp "$ROOT/tests/promo/fixtures/color-scene.html" "$w/scene.html"
npm i --silent --prefer-offline --prefix "$w" playwright-core >/dev/null 2>&1
cd "$w"
# a longer earlier render: its tail frames must not survive a new capture
for i in $(seq 30 39); do printf 'stale' > "$(printf 'out/%05d.jpg' "$i")"; done
CAPTURE_WORKERS=3 node "$ROOT/skills/promo/scripts/capture.mjs" frames >/dev/null
n=$(ls out/*.jpg | wc -l)
[[ $n -eq 30 ]] || { echo "FAIL: expected 30 frames, got $n"; exit 1; }
for i in 0 11 29; do
  f=$(printf 'out/%05d.jpg' "$i")
  read -r r b <<< "$($IM "$f" -format '%[fx:int(255*p{160,284}.r)] %[fx:int(255*p{160,284}.b)]' info:)"
  (( ${r} - i*8 < 6 && i*8 - ${r} < 6 && ${b} - (255 - i*8) < 6 && (255 - i*8) - ${b} < 6 )) \
    || { echo "FAIL: frame $i has r=$r b=$b, want r=$((i*8)) b=$((255 - i*8))"; exit 1; }
done
node "$ROOT/skills/promo/scripts/capture.mjs" stills 0.5 >/dev/null
[[ -f check/t0.50.png ]] || { echo "FAIL: no still"; exit 1; }
# landscape/square pages are laid out at their own size before ready resolves
cp "$ROOT/tests/promo/fixtures/landscape-scene.html" scene.html
node "$ROOT/skills/promo/scripts/capture.mjs" stills 0 >/dev/null
read -r g <<< "$($IM check/t0.00.png -format '%[fx:int(255*p{960,540}.g)]' info:)"
[[ $g -gt 150 ]] || { echo "FAIL: landscape page laid out at the wrong size"; exit 1; }
# encode assumes 30fps, so another rate must stop the capture
cp "$ROOT/tests/promo/fixtures/fps25-scene.html" scene.html
if node "$ROOT/skills/promo/scripts/capture.mjs" frames >/dev/null 2>&1; then echo "FAIL: fps 25 accepted"; exit 1; fi
echo "capture.mjs: ok"
