#!/usr/bin/env bash
# Self-check for skills/promo/kit: frame lookup, panel shots and the end card, vertical and landscape.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
IM=$(command -v magick >/dev/null && echo "magick" || echo "convert")
t=$(mktemp -d); trap 'rm -rf "$t"' EXIT
npm i --silent --prefer-offline --prefix "$t" playwright-core >/dev/null 2>&1
px() { $IM "$1" -format "%[fx:int(255*p{$2,$3}.r)] %[fx:int(255*p{$2,$3}.g)] %[fx:int(255*p{$2,$3}.b)]" info:; }
for fmt in 320x568 568x320; do
  W=${fmt%x*}; H=${fmt#*x}; w="$t/$fmt"
  mkdir -p "$w/frames/a"
  cp "$ROOT/skills/promo/kit/scene.html" "$ROOT/skills/promo/kit/kit.js" "$w/"
  : > "$w/fonts.css"
  $IM -size 60x60 xc:white "$w/logo.png"
  # clip frames colored by index, so a wrong frame lookup is visible
  for i in $(seq 1 30); do $IM -size 64x64 "xc:rgb($(( (i-1)*8 )),0,$(( 255-(i-1)*8 )))" "$w/frames/a/$(printf '%05d' $i).jpg"; done
  # other-aspect media for this format: a wide still in vertical, a tall one in landscape
  if (( W < H )); then $IM -size 640x360 xc:red "$w/wide.png"; else $IM -size 360x640 xc:red "$w/wide.png"; fi
  cat > "$w/timeline.js" <<JS
window.PROMO = { width: $W, height: $H, duration: 2.0, end: 1.5,
  shots: [ { a: 0, b: 1, clip: "frames/a", n: 30, push: [1, 1] },
           { a: 1, b: 1.5, still: "wide.png", panel: true, push: [1, 1] } ] };
JS
  (cd "$w" && node "$ROOT/skills/promo/scripts/capture.mjs" frames >/dev/null)
  n=$(ls "$w"/out/*.jpg | wc -l); [[ $n -eq 60 ]] || { echo "FAIL $fmt: $n frames"; exit 1; }
  for i in $(seq 0 29); do  # frame i at t=i/30 must show clip frame i+1 (the 1e-6 floor fix)
    read -r r g b <<< "$(px "$w/out/$(printf '%05d' $i).jpg" $((W/2)) $((H/2)))"
    (( r - i*8 < 10 && i*8 - r < 10 && b - (255-i*8) < 10 && (255-i*8) - b < 10 )) || { echo "FAIL $fmt: frame $i shows r=$r b=$b"; exit 1; }
  done
  read -r r g b <<< "$(px "$w/out/00036.jpg" $((W/2)) $((H/2)))"
  (( r > 200 && g < 60 )) || { echo "FAIL $fmt: panel not shown ($r $g $b)"; exit 1; }
  read -r r g b <<< "$(px "$w/out/00036.jpg" 3 3)"
  (( r < 170 )) || { echo "FAIL $fmt: panel background not dimmed ($r)"; exit 1; }
  read -r r g b <<< "$(px "$w/out/00055.jpg" $((W/2)) $((H-4)))"
  (( r > 220 && g > 220 )) || { echo "FAIL $fmt: end card not in ($r $g $b)"; exit 1; }
done
# a gap in the timeline is a readable error, not a stack trace
g="$t/gap"; mkdir -p "$g"
cp "$ROOT/skills/promo/kit/scene.html" "$ROOT/skills/promo/kit/kit.js" "$g/"; : > "$g/fonts.css"; cp "$t/320x568/wide.png" "$g/"
echo 'window.PROMO = { width: 320, height: 568, duration: 2, shots: [ { a: 0, b: 1, still: "wide.png" }, { a: 1.5, b: 2, still: "wide.png" } ] };' > "$g/timeline.js"
ln -s "$t/node_modules" "$g/node_modules"
if out=$(cd "$g" && node "$ROOT/skills/promo/scripts/capture.mjs" stills 0 2>&1); then echo "FAIL: gap accepted"; exit 1; fi
grep -q "gap" <<< "$out" || { echo "FAIL: gap error unclear: $out"; exit 1; }
echo "kit: ok"
