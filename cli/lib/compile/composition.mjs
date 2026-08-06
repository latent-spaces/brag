/**
 * The composition itself: a real HyperFrames project directory.
 *
 * Phase 1 emits an *outline* composition — honest structure, real copy, real
 * palette, one wrapper per scene named `#el-<scene-id>` so motion-doctrine's
 * seam-stamp can write the seam tweens from the ledger. Frame workers replace
 * the interiors in a later phase; the wrappers, timing and assertions do not
 * change when they do.
 *
 * Project scaffolding is written here rather than shelled out to
 * `hyperframes init` for two reasons: init refuses a non-empty directory, and
 * a scaffold that varies between runs would break the byte-identical recompile
 * gate that everything downstream depends on.
 */

import { TERMINAL_CSS, buildTerminalScene } from "./terminal-scene.mjs";
import { assignLayouts } from "../worlds.mjs";
import { scheduleReading, withStarts } from "./targets.mjs";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Trailing overlap so a seam's exit tween has somewhere to live. */
const SEAM_TAIL = 0.4;

export function projectFiles({ name, graph, pin }) {
  return {
    "hyperframes.json": JSON.stringify(
      {
        $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
        registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
        paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
        media: { autoProxy: true },
      },
      null,
      2,
    ) + "\n",

    "meta.json": JSON.stringify({ id: name, name }, null, 2) + "\n",

    "package.json":
      JSON.stringify(
        {
          name,
          private: true,
          type: "module",
          scripts: {
            dev: `npx --yes ${pin} preview`,
            check: `npx --yes ${pin} check`,
            render: `npx --yes ${pin} render`,
          },
        },
        null,
        2,
      ) + "\n",
  };
}

/* ------------------------------------------------------------------ index.html */

export function buildIndexHtml({ model, graph, world, captures = {} }) {
  const scenes = withStarts(graph);
  const layoutFor = new Map(
    assignLayouts(world, scenes, graph.seams ?? []).map((a) => [a.scene, a.layout]),
  );
  const { width, height, fps } = graph.format;
  const duration = Number(
    scenes.reduce((max, s) => Math.max(max, s.start + s.duration), 0).toFixed(3),
  );

  const palette = model.identity?.palette ?? [];
  const pick = (role, fallback) =>
    palette.find((p) => p.role === role || p.role.endsWith(`-${role}`))?.value ?? fallback;

  const c = {
    bg: pick("bg", "#0c1018"),
    surface: pick("surface", "#121b28"),
    border: pick("border", "#243144"),
    text: pick("text", "#e7edf7"),
    muted: pick("muted", "#94a3b8"),
    accent: pick("accent", "#5272f2"),
  };

  const scale = Math.min(width, height) / 1080;
  const typeScale = world?.typography?.display_scale ?? 1;
  const px = (n) => Math.round(n * scale);
  const tx = (n) => Math.round(n * scale * typeScale);


  /* One CSS class per layout the chosen world declares. Scenes rotate through
     them, so consecutive frames are composed differently — which is the thing
     that stops a film reading as the same picture with new words in it. */
  const ALIGN = { leading: "flex-start", center: "center", trailing: "flex-end" };
  const ANCHOR = {
    top: "flex-start",
    upper: "flex-start",
    middle: "center",
    lower: "flex-end",
    split: "space-between",
  };
  const layoutCss = world.layouts
    .map((l) => {
      const inset = Math.round((l.inset ?? 0.08) * Math.min(width, height));
      /* Nothing anchors into the caption band: an "upper" block starts high,
         a "lower" one still stops short of the bottom 17%. */
      const top = l.anchor === "upper" ? Math.round(height * 0.14) : inset;
      const bottom = l.anchor === "lower" ? Math.round(height * 0.2) : inset;
      const side = Math.round(inset * 1.3);
      return [
        `      .lay-${l.id} {`,
        `        top: ${top}px; bottom: ${bottom}px; left: ${side}px; right: ${side}px;`,
        `        align-items: ${ALIGN[l.align] ?? "flex-start"};`,
        `        justify-content: ${ANCHOR[l.anchor] ?? "center"};`,
        `        text-align: ${l.align === "center" ? "center" : l.align === "trailing" ? "right" : "left"};`,
        l.scale && l.scale !== 1 ? `        font-size: ${l.scale}em;` : "",
        l.chrome === "panel"
          ? `        background: var(--surface); border: 1px solid var(--border); border-radius: ${px(16)}px; padding: ${px(48)}px;`
          : l.chrome === "frame"
            ? `        border: 1px solid var(--border); padding: ${px(44)}px;`
            : l.chrome === "rule"
              ? `        border-top: 2px solid var(--accent); padding-top: ${px(36)}px;`
              : "",
        "      }",
        /* A split anchor with one child is not a split. Centring it would be
           the safe answer and the wrong one: every other layout already
           centres, so collapsing this one too makes consecutive scenes the
           same picture with different words in them. It keeps its own band —
           below the middle, clear of the caption zone. */
        l.anchor === "split"
          ? `      .lay-${l.id}.solo { justify-content: flex-end; bottom: ${Math.round(height * 0.28)}px; }`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const terminals = [];
  const clips = scenes.map((scene, i) => {
    const isLast = i === scenes.length - 1;
    const clipDuration = Number((scene.duration + (isLast ? 0 : SEAM_TAIL)).toFixed(3));
    const reading = scene.reading ?? [];

    /* A scene whose focal object points at a capture shows the real thing the
       tool printed, not a description of it. */
    /* Only the scene that makes the object focal shows the capture. An object
       can appear in several scenes — that is what makes it an object — but
       rendering the terminal in all of them puts the same panel on screen
       three times and calls it continuity. */
    const captureId = (scene.objects ?? [])
      .filter((o) => o.focal)
      .map((o) => graph.objects?.find((g) => g.id === o.id)?.content_ref)
      .find((ref) => ref && captures[ref]);
    const terminal = captureId
      ? buildTerminalScene({
          scene,
          session: captures[captureId],
          start: scene.start,
          duration: scene.duration,
          geometry: { width, height },
          px,
        })
      : null;
    if (terminal) terminals.push(terminal);

    const body = [
      `      <div class="bg"></div>`,
      /* A split anchor distributes its children between the top and bottom
         edges, which is a composition only when there is more than one thing
         to distribute. A scene holding a kicker and a single line has nothing
         to split, so in a tall frame the line is pushed into the caption band
         with a screen of dead space above it. Those collapse to centred. */
      `      <div class="stage lay-${(layoutFor.get(scene.id) ?? { id: "default" }).id}${
        (terminal ? 1 : 0) + Math.max(reading.length, 1) > 1 ? "" : " solo"
      }" id="stage-${scene.id}">`,
      terminal ? terminal.html : "",
      /* A scene's role is how the storyboard classifies it — "Key_Feature",
         "Social_Proof", "Brand_Outro". Printing it on the frame puts brag's
         own filing system in front of the viewer: a blind reviewer read the
         labels as an unfinished export, and objected that a card marked
         SOCIAL PROOF contained no third party. It was right on both counts.
         The role stays in the graph, where it belongs. */
      ...reading.map(
        (r, ri) =>
          `        <p class="${ri === 0 ? "lead" : "line"}" id="read-${scene.id}-${ri}">${esc(r.text)}</p>`,
      ),
      reading.length === 0
        ? `        <p class="lead" id="read-${scene.id}-0">${esc(scene.title ?? scene.purpose)}</p>`
        : "",
      `      </div>`,
    ]
      .filter(Boolean)
      .join("\n");

    return [
      `    <section id="el-${scene.id}" class="clip" data-start="${Number(scene.start.toFixed(3))}" data-duration="${clipDuration}" data-track-index="${i % 2}">`,
      body,
      `    </section>`,
    ].join("\n");
  });

  /* Per-scene reveals. Reading lines rise into place fast and then hold for
     their floor — the pace comes from the cut, never from pulling copy away
     before it can be read. */
  const tweens = scenes.flatMap((scene) => {
    const out = [];
    for (const line of scheduleReading(scene)) {
      /* The film's very first line cannot fade up from nothing. Frame 0 is
         both the thumbnail and the image a paused player parks on, so an
         entrance starting at t=0 means the video advertises itself with an
         empty background. It arrives already legible and rises into place. */
      const opensTheFilm = line.enter <= 0.001 && line.index === 0;
      out.push(
        `      tl.fromTo("#read-${scene.id}-${line.index}", ` +
          `{ opacity: ${opensTheFilm ? 1 : 0}, y: ${px(opensTheFilm ? 12 : 28)} }, ` +
          `{ opacity: 1, y: 0, duration: 0.4, ease: "power4.out" }, ${line.enter});` +
          `  // settled ${line.settled}s, floor ${line.floor}s${line.tight ? " (TIGHT — scene is too short for this copy)" : ""}`,
      );
    }
    return out;
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${width}, height=${height}" />
    <title>${esc(model.name ?? "brag")}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${width}px; height: ${height}px; overflow: hidden; background: ${c.bg}; }
      :root {
        --bg: ${c.bg};
        --surface: ${c.surface};
        --border: ${c.border};
        --text: ${c.text};
        --muted: ${c.muted};
        --accent: ${c.accent};
        --sans: Inter, "Segoe UI", system-ui, sans-serif;
        --mono: "JetBrains Mono", Consolas, ui-monospace, monospace;
      }
      #root {
        position: relative;
        width: ${width}px;
        height: ${height}px;
        overflow: hidden;
        background: var(--bg);
        font-family: var(--sans);
        color: var(--text);
      }
      .clip { position: absolute; inset: 0; }
      .bg { position: absolute; inset: 0; background: var(--bg); }
      .stage {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: ${px(24)}px;
      }
${layoutCss}
      .lead {
        font-size: ${tx(64)}px;
        line-height: ${tx(78)}px;
        font-weight: 600;
        letter-spacing: -0.02em;
        max-width: ${px(1500)}px;
        opacity: 0;
      }
${world && terminals.length ? TERMINAL_CSS : ""}
      .line {
        font-size: ${tx(34)}px;
        line-height: ${tx(46)}px;
        color: var(--muted);
        max-width: ${px(1400)}px;
        opacity: 0;
      }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="${duration}"
      data-width="${width}"
      data-height="${height}"
      data-fps="${fps}"
    >
${clips.join("\n")}
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

${[...tweens, ...terminals.flatMap((t) => t.tweens)].join("\n")}

      window.__timelines["main"] = tl;
      // <seams:auto>
      // </seams:auto>
    </script>
  </body>
</html>
`;
}

/* ------------------------------------------------------------------ frame stubs */

/**
 * Outline sub-compositions, one per scene. They are not wired into index.html
 * yet — the storyboard's `src` points here so Studio's board can render tiles,
 * and frame workers overwrite these files in a later phase.
 */
export function buildFrameStub({ scene, model, graph }) {
  const reading = scene.reading?.length ? scene.reading : [{ text: scene.title ?? scene.purpose }];
  return `<!-- outline frame: ${scene.id} -->
<template>
  <div
    data-composition-id="${scene.id}"
    data-start="0"
    data-duration="${scene.duration}"
    data-width="${graph.format.width}"
    data-height="${graph.format.height}"
  >
    <section class="clip" data-start="0" data-duration="${scene.duration}" data-track-index="0">
${reading.map((r) => `      <p>${esc(r.text)}</p>`).join("\n")}
    </section>
  </div>
</template>
`;
}
