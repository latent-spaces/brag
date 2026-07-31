# brag — site

Static single-page launch site for `/brag`. Plain HTML/CSS/JS, no framework, no build step. This folder is the GitHub Pages deploy root.

## Local preview

```bash
python3 -m http.server 8000
open http://localhost:8000
```

## Sanity check

```bash
node ../scripts/check-docs.mjs
```

This verifies local docs links and media paths, plus the gallery count copy.

## Deploy (GitHub Pages)

Fully self-contained — no build step. In the repo's **Settings → Pages**, set the source to **Deploy from a branch**, branch `main`, folder **`/docs`**.

The gallery videos ship committed: each demo shown (`examples/horse-tinder/`, `examples/fish-flight-school/`, `examples/taxi-for-taxis/`) includes its `brag.mp4`, a `brag.jpg` poster, and a `site.jpg` thumbnail. Heavy composition sources (`brag-output-*/`) are git-ignored.

## Adding / updating a gallery example

1. Render the brag video and place `brag.mp4`, `brag.jpg` (poster), and `site.jpg` (thumbnail) under `examples/<slug>/`, next to the demo's `index.html` and `styles.css`. Pick `brag.jpg` as the **best** frame, not an arbitrary one — grab the video's strongest settled beat (the hook line, or the hero/logo reveal) full-res with ffmpeg, then bake it as the video's frame 0 so idle thumbnails everywhere show it:

   ```bash
   # extract the best settled beat as the poster
   ffmpeg -ss 3.2 -i docs/examples/<slug>/brag.mp4 -frames:v 1 -q:v 2 docs/examples/<slug>/brag.jpg

   # replace only frame 0 with the poster (same duration, frames, and audio)
   cd docs/examples/<slug>
   ffmpeg -y -i brag.mp4 -i brag.jpg \
     -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]" \
     -map "[v]" -map 0:a? -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
     -c:a copy -movflags +faststart brag.poster.mp4 && mv brag.poster.mp4 brag.mp4
   ```
2. Add a card in `index.html` pointing at those paths.
3. Un-ignore the slug in `.gitignore` and commit the assets.
