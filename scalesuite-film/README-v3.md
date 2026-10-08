# ScaleSuite film V3

Plan: `../brag-output/storyboard-v3.md` · identity: `../brag-output/design-dna-v3.json`.
The V2 sources and outputs are untouched. V3 loads `src/core.js`, `src/logo.js` and `src/styles.css`
read-only and adds its own files with a `-v3` suffix.

```
./build-v3.sh preview    # scenes 1–3 (0–8.5 s): 540×960 30 fps preview with sound + contact sheet
```

Outputs: `../brag-output/previews/scalesuite-preview-9x16-30fps-v3-s1-3.mp4`,
`../brag-output/scalesuite-contact-sheet-v3-s1-3.jpg` (intermediates in `../brag-output/work-v3`).

## How it renders

- `index-v3.html` builds every scene once. All choreography lives in one **paused GSAP 3.13
  timeline** (`SS.tl`, vendored in `vendor/gsap-3.13.0`). Each captured frame calls
  `SS.renderFrame(t)`: `SS.tl.seek(t)`, then every scene's procedural `render(t)` (camera matrix,
  shake noise, odometer, speed blur), then a screenshot. The picture is a pure function of `t`.
- **World camera** (`SS.cam`, `SS.camTo`): one 2D transform on the world layer gives the pushes,
  pulls, jolts and the shake. No `will-change` anywhere, and GSAP is set to `force3D: false`, so Chrome
  re-rasterises text at every zoom level and nothing turns blurry.
- Sound cues are collected while the timeline is built and exported by `render/cues-v3.mjs`.
  `audio/music-v3.py` synthesises the score on those exact times.

## Rules that keep `seek()` deterministic

The DOM state for a given `t` is checked identical whatever the seek history (forward, backward,
jumps). Keep it that way:

1. Use `fromTo()` only, with explicit start values. Set every animated property's initial state at
   build time.
2. Never let two tweens on the same property of the same element overlap in time. The result would
   depend on render order.
3. A DOM property is driven either by GSAP or by a `render(t)` function, never by both. Procedural
   values go through plain proxy objects that GSAP tweens.
4. Speed blur is procedural (`SS.blur`): a rewound GSAP filter leaves `blur(0px)`, which renders
   differently from `none`.
5. Round random values at build time, so GSAP writes the same transform string whichever tween set
   it last.
6. Never pass a shared object to `gsap.set()`: GSAP writes `duration` into the vars it receives.
