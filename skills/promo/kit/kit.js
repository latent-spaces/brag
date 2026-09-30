// /promo render kit. Every frame is a pure function of t (see SKILL.md, "The page").
// timeline.js loads first and sets:
//   window.PROMO = { width, height, duration, end, grain, fonts, shots: [...] }
// shots, in order, each { a, b } in seconds plus one of:
//   clip: "frames/s01", n: 65          frames written by `footage.py shot`
//   still: "stills/004.jpg"            a photo, an AI image or a background still
// and optionally:
//   panel: true            show the whole frame in a panel over a blurred copy (other-aspect media)
//   push: [from, to]       scale over the shot (default [1, 1.025]); origin: "50% 64%"
//   filter: "blur(16px) brightness(.42)"   CSS filter (e.g. a dimmed background behind a text card)
//   grade: "saturate(.9) contrast(1.05)"   colour match for AI stills and photos next to footage
//   grain: 0.12            film grain for this shot (PROMO.grain sets it for every shot)
// Captions and the end card are DOM in scene.html: .cap[data-a][data-b], children [data-at]
// (absolute seconds), data-scrim="top|bottom"; #end wipes in at PROMO.end.
(() => {
  const P = window.PROMO, FPS = 30;
  const $ = (s) => document.querySelector(s);
  const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
  const ramp = (t, a, b) => clamp((t - a) / (b - a));
  const outCubic = (x) => 1 - Math.pow(1 - x, 3);
  const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  // one layout for every format: sizes scale with the short side, captions sit inside the platform safe zones
  const portrait = P.height > P.width, css = document.documentElement.style;
  css.setProperty("--W", `${P.width}px`);
  css.setProperty("--H", `${P.height}px`);
  css.setProperty("--k", Math.min(P.width, P.height) / 1080);
  css.setProperty("--safe-top", `${Math.round(P.height * (portrait ? 0.12 : 0.08))}px`);
  css.setProperty("--safe-bottom", `${Math.round(P.height * (portrait ? 0.2 : 0.1))}px`);
  css.setProperty("--side", `${Math.round(P.width * 0.066)}px`);

  const foot = $("#foot"), panel = $("#panel"), grain = $("#grain");
  const shown = new Map();
  async function show(img, src) {
    if (shown.get(img) === src) return;
    img.src = src;
    shown.set(img, src);
    await img.decode();
  }

  // clip frame for time t; the epsilon keeps (i/30)*30 from flooring to i-1 and repeating a frame
  const frameAt = (s, t) => Math.min(s.n, Math.floor((t - s.a) * FPS + 1e-6) + 1);

  async function drawShot(t) {
    const s = P.shots.find((s) => t >= s.a && t < s.b) || P.shots[P.shots.length - 1];
    const p = clamp((t - s.a) / (s.b - s.a));
    const src = s.clip ? `${s.clip}/${String(frameAt(s, t)).padStart(5, "0")}.jpg` : s.still;
    const [from, to] = s.push || [1, 1.025];
    const scale = from + (to - from) * inOutCubic(p);
    if (s.panel) {
      await Promise.all([show(foot, src), show(panel, src)]);
      const fit = Math.min(P.width / panel.naturalWidth, P.height / panel.naturalHeight);
      const w = panel.naturalWidth * fit, h = panel.naturalHeight * fit;
      Object.assign(panel.style, {
        width: `${w}px`, height: `${h}px`, left: `${(P.width - w) / 2}px`, top: `${(P.height - h) / 2}px`,
        opacity: 1, transform: `scale(${scale})`, filter: s.grade || "none",
      });
      Object.assign(foot.style, { filter: "blur(26px) brightness(.5)", transform: "scale(1.25)", transformOrigin: "50% 50%" });
    } else {
      await show(foot, src);
      panel.style.opacity = 0;
      Object.assign(foot.style, {
        filter: [s.filter, s.grade].filter(Boolean).join(" ") || "none",
        transformOrigin: s.origin || "50% 50%", transform: `scale(${scale})`,
      });
    }
    // grain moves every frame but is still a function of t
    const f = Math.floor(t * FPS + 1e-6);
    grain.style.opacity = s.grain ?? P.grain ?? 0;
    grain.style.backgroundPosition = `${(f * 73) % 256}px ${(f * 151) % 256}px`;
  }

  function animate(el, t) {
    for (const x of el.querySelectorAll("[data-at]")) {
      const q = outCubic(ramp(t, +x.dataset.at, +x.dataset.at + 0.4));
      const dir = x.closest("[dir=rtl]") ? -1 : 1;  // list rows slide in from the reading side
      x.style.opacity = q;
      x.style.transform = x.classList.contains("row") ? `translateX(${(1 - q) * 40 * dir}px)` : `translateY(${(1 - q) * 24}px)`;
    }
  }

  function drawCaptions(t) {
    let top = 0, bottom = 0;
    for (const el of document.querySelectorAll(".cap[data-a]")) {
      const a = +el.dataset.a, b = +el.dataset.b;
      const live = t >= a - 0.05 ? 1 - ramp(t, b - 0.25, b) : 0;
      el.style.opacity = live;
      const rule = el.querySelector(".rule");
      if (rule) rule.style.width = `calc(${outCubic(ramp(t, a, a + 0.55)) * 120}px * var(--k))`;
      animate(el, t);
      if (el.dataset.scrim === "top") top = Math.max(top, live);
      if (el.dataset.scrim === "bottom") bottom = Math.max(bottom, live);
    }
    $("#scrim-top").style.opacity = top;
    $("#scrim-bottom").style.opacity = bottom;
  }

  function drawEnd(t) {
    const end = $("#end");
    if (!end || P.end == null) return;
    const w = inOutCubic(ramp(t, P.end, P.end + 0.42));
    end.style.clipPath = `inset(${(1 - w) * 100}% 0 0 0)`;
    $("#edge").style.top = `${(1 - w) * P.height - 4}px`;
    $("#edge").style.opacity = w > 0 && w < 1 ? 1 : 0;
    animate(end, t);
  }

  window.render = async (t) => {
    await drawShot(t);
    drawCaptions(t);
    drawEnd(t);
  };

  window.ready = (async () => {
    // shots must follow each other from 0 without gaps (a gap would show the wrong shot);
    // the last one may end early: it holds under the end card
    let at = 0;
    for (const s of P.shots) {
      if (Math.abs(s.a - at) > 1e-6) throw new Error(`timeline gap or overlap: a shot starts at ${s.a}s, expected ${at}s`);
      at = s.b;
    }
    for (const [font, sample] of P.fonts || []) await document.fonts.load(font, sample);  // ["600 80px Vazirmatn", "فارسی"]
    await document.fonts.ready;
    for (const s of P.shots) if (s.still) { const i = new Image(); i.src = s.still; await i.decode(); }
    for (const i of document.images) if (i.getAttribute("src")) await i.decode();
    await window.render(0);
    return { fps: FPS, duration: P.duration, width: P.width, height: P.height };
  })();
})();
