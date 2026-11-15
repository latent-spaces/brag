"""Timecoded transcript + teleprompter video for a brag output folder.

usage: python3 teleprompter.py <output_dir> [--render]

Reads <output_dir>/composition/index.html (where and how long each dialogue clip plays) and
composition/assets/vo/script.json ({"voice": "...", "lines": {"vo1": "text", ...}}).
Writes into <output_dir>/stems/:
  transcript.txt   timecoded script for talent / edit notes (HH:MM:SS:FF)
  transcript.srt   caption sidecar
  transcript.vtt   caption sidecar
  transcript.json  line, sentence and word timings (seconds)
and builds <output_dir>/teleprompter/ (a Hyperframes composition, 1920x1080). With --render it
renders stems/teleprompter.mp4: scrolling script, running timecode, the dialogue stem as guide audio.

Sentence timing comes from the pauses inside each clip; word timing within a sentence is estimated
from word length. Clip in/out times are exact.
"""
import argparse, glob, html, json, os, re, shutil, subprocess

ap = argparse.ArgumentParser()
ap.add_argument("output_dir")
ap.add_argument("--render", action="store_true")
args = ap.parse_args()

od = os.path.abspath(args.output_dir)
comp = os.path.join(od, "composition")
stems = os.path.join(od, "stems")
os.makedirs(stems, exist_ok=True)
src = open(os.path.join(comp, "index.html")).read()
root = re.search(r'id="root"[^>]*>', src).group(0)
total = float(re.search(r'data-duration="([\d.]+)"', root).group(1))
fps = int(float((re.search(r'data-fps="([\d.]+)"', root) or [0, 30])[1]))

script_path = os.path.join(comp, "assets", "vo", "script.json")
if not os.path.exists(script_path):
    raise SystemExit(f"missing {script_path}: write {{\"voice\": ..., \"lines\": {{\"vo1\": \"text\", ...}}}}")
script = json.load(open(script_path))


def tc(t):
    f = int(round(t * fps))
    return f"{f // (3600 * fps):02d}:{f // (60 * fps) % 60:02d}:{f // fps % 60:02d}:{f % fps:02d}"


def srt_ts(t, sep=","):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d}{sep}{ms % 1000:03d}"


def speech_spans(path, dur):
    """[(start, end)] of speech inside a clip, split at pauses."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
                        "silencedetect=noise=-35dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
    sil = list(zip(starts, ends + [dur] * (len(starts) - len(ends))))
    spans, cur = [], 0.0
    for s, e in sil:
        if s > cur + 0.05:
            spans.append((max(cur, 0), s))
        cur = e
    if dur > cur + 0.05:
        spans.append((cur, dur))
    return spans or [(0, dur)]


def split_sentences(text):
    parts = re.findall(r"[^.?!…]+[.?!…]+[”\"']?|[^.?!…]+$", text)
    return [p.strip() for p in parts if p.strip()]


def word_times(sentence, s, e):
    words = sentence.split()
    w = [len(re.sub(r"\W", "", x)) + 2 for x in words]
    tot, t, out = sum(w), s, []
    for word, wt in zip(words, w):
        d = (e - s) * wt / tot
        out.append({"w": word, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


lines = []
for m in re.finditer(r"<audio\b([^>]*)>", src):
    a = m.group(1)
    g = lambda k: (re.search(k + r'="([^"]*)"', a) or [None, None])[1]
    cid = g("id") or ""
    if cid not in script["lines"]:
        continue
    start, dur = float(g("data-start")), float(g("data-duration"))
    text = script["lines"][cid]
    sents = split_sentences(text)
    spans = speech_spans(os.path.join(comp, g("src")), dur)
    if len(spans) > len(sents):  # keep the longest pauses, merge the rest
        gaps = sorted(range(len(spans) - 1), key=lambda i: spans[i + 1][0] - spans[i][1], reverse=True)[:len(sents) - 1]
        merged, cur = [], spans[0]
        for i in range(len(spans) - 1):
            if i in gaps:
                merged.append(cur); cur = spans[i + 1]
            else:
                cur = (cur[0], spans[i + 1][1])
        spans = merged + [cur]
    if len(spans) != len(sents):  # fall back: share the speech span by length
        s0, e0 = spans[0][0], spans[-1][1]
        L = [len(x) for x in sents]
        spans, t = [], s0
        for l in L:
            d = (e0 - s0) * l / sum(L)
            spans.append((t, t + d)); t += d
    sentences = []
    for sent, (s, e) in zip(sents, spans):
        sentences.append({"text": sent, "start": round(start + s, 3), "end": round(start + e, 3),
                          "words": word_times(sent, start + s, start + e)})
    lines.append({"id": cid, "text": text, "start": round(start + spans[0][0], 3),
                  "end": round(start + spans[-1][1], 3), "sentences": sentences})
lines.sort(key=lambda l: l["start"])

# ---- transcript files
title = os.path.basename(od)
with open(os.path.join(stems, "transcript.txt"), "w") as f:
    f.write(f"{title}: narration transcript\nVoice: {script.get('voice', '?')}  |  {total}s @ {fps} fps  |  timecode HH:MM:SS:FF\n\n")
    for i, l in enumerate(lines, 1):
        f.write(f"{i:>2}  {tc(l['start'])} → {tc(l['end'])}  ({l['end'] - l['start']:.2f}s)\n    {l['text']}\n\n")
with open(os.path.join(stems, "transcript.srt"), "w") as f:
    for i, l in enumerate(lines, 1):
        f.write(f"{i}\n{srt_ts(l['start'])} --> {srt_ts(l['end'])}\n{l['text']}\n\n")
with open(os.path.join(stems, "transcript.vtt"), "w") as f:
    f.write("WEBVTT\n\n")
    for l in lines:
        f.write(f"{srt_ts(l['start'], '.')} --> {srt_ts(l['end'], '.')}\n{l['text']}\n\n")
json.dump({"title": title, "voice": script.get("voice"), "duration": total, "fps": fps, "lines": lines},
          open(os.path.join(stems, "transcript.json"), "w"), indent=1, ensure_ascii=False)

# ---- teleprompter composition
tp = os.path.join(od, "teleprompter")
os.makedirs(os.path.join(tp, "assets"), exist_ok=True)
font_css = ""
for pat, fam in (("*inter*.woff2", "Inter"), ("*share-tech*.woff2", "Share Tech Mono")):
    hits = glob.glob(os.path.join(comp, "assets", "fonts", pat))
    if hits:
        shutil.copy(hits[0], os.path.join(tp, "assets", os.path.basename(hits[0])))
        font_css += f"@font-face {{ font-family: '{fam}'; src: url('assets/{os.path.basename(hits[0])}') format('woff2'); font-weight: 100 900; font-display: block; }}\n"
guide = os.path.join(stems, "dialogue.wav")
audio_tag = ""
if os.path.exists(guide):
    shutil.copy(guide, os.path.join(tp, "assets", "guide.wav"))
    audio_tag = f'<audio id="guide" src="assets/guide.wav" data-start="0" data-duration="{total}" data-track-index="2" data-volume="1"></audio>'

blocks = []
for i, l in enumerate(lines):
    words = "".join(f'<span class="w" id="w{i}_{j}_{k}">{html.escape(w["w"])}</span> '
                    for j, s in enumerate(l["sentences"]) for k, w in enumerate(s["words"]))
    blocks.append(f'<div class="blk" id="b{i}"><div class="tin">{tc(l["start"])}</div><div class="txt">{words}</div></div>')

page = f"""<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=1920, height=1080" />
<title>Teleprompter — {html.escape(title)}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
{font_css}
html, body {{ margin: 0; background: #000; }}
#root {{ position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #000; color: #f4f4f5; font-family: 'Inter', sans-serif; }}
.mono {{ font-family: 'Share Tech Mono', monospace; letter-spacing: 0.08em; }}
.top {{ position: absolute; left: 0; right: 0; top: 0; height: 150px; display: flex; align-items: center; justify-content: space-between; padding: 0 80px; box-sizing: border-box; background: #000; z-index: 3; border-bottom: 2px solid #26262b; }}
#tc {{ font-size: 92px; color: #ffd84d; font-variant-numeric: tabular-nums; }}
.meta {{ text-align: right; font-size: 30px; color: #8b8b93; line-height: 1.5; white-space: nowrap; }}
.meta b {{ color: #f4f4f5; font-weight: 400; }}
.guide {{ position: absolute; left: 0; right: 0; top: 368px; height: 0; border-top: 3px solid rgba(0,255,102,0.55); z-index: 2; }}
.arrow {{ position: absolute; left: 22px; top: 394px; width: 0; height: 0; border-top: 28px solid transparent; border-bottom: 28px solid transparent; border-left: 40px solid #00ff66; z-index: 2; }}
.view {{ position: absolute; left: 0; right: 0; top: 152px; bottom: 12px; overflow: hidden; }}
.col {{ position: absolute; left: 0; right: 0; top: 0; padding: 0 120px 0 90px; }}
.blk {{ display: flex; gap: 44px; padding: 26px 0 58px; opacity: 0.4; }}
.tin {{ flex: 0 0 auto; width: 290px; font-family: 'Share Tech Mono', monospace; font-size: 40px; line-height: 84px; color: #00ff66; font-variant-numeric: tabular-nums; }}
.txt {{ flex: 1; font-size: 70px; line-height: 84px; font-weight: 600; color: #8b8b93; }}
.w.on {{ color: #ffffff; }}
#standby {{ position: absolute; left: 0; right: 0; top: 520px; text-align: center; font-size: 48px; color: #8b8b93; z-index: 2; }}
.bar {{ position: absolute; left: 0; bottom: 0; height: 12px; width: 1920px; background: #1a1a1d; z-index: 3; }}
#fill {{ height: 12px; width: 1920px; background: #00ff66; transform-origin: 0 50%; }}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="{total}" data-fps="{fps}">
  <div class="view"><div class="col" id="col" data-layout-allow-overflow>{''.join(blocks)}</div></div>
  <div class="guide"></div><div class="arrow"></div>
  <div id="standby" class="mono">STAND BY · FIRST LINE AT {tc(lines[0]['start']) if lines else ''}</div>
  <div class="top"><div id="tc" class="mono">{tc(0)}</div>
    <div class="meta mono"><b>{html.escape(title)}</b><br><span id="ln">LINE 0 / {len(lines)}</span> · {html.escape(script.get('voice') or '')}</div></div>
  <div class="bar"><div id="fill"></div></div>
  {audio_tag}
</div>
<script>
(function () {{
  const L = {json.dumps([{"start": l["start"], "end": l["end"], "words": [[f"w{i}_{j}_{k}", w["start"]] for j, s in enumerate(l["sentences"]) for k, w in enumerate(s["words"])]} for i, l in enumerate(lines)])};
  const FPS = {fps}, TOTAL = {total}, GUIDE = 380 - 152 - 26;
  const tl = gsap.timeline({{ paused: true }});
  const pad = n => String(n).padStart(2, "0");
  const tcEl = document.getElementById("tc"), lnEl = document.getElementById("ln");
  const clock = {{ t: 0 }};
  tl.to(clock, {{ t: TOTAL, duration: TOTAL, ease: "none", onUpdate: function () {{
    const f = Math.round(clock.t * FPS);
    tcEl.textContent = pad(Math.floor(f / (3600 * FPS))) + ":" + pad(Math.floor(f / (60 * FPS)) % 60) + ":" + pad(Math.floor(f / FPS) % 60) + ":" + pad(f % FPS);
    let n = 0; for (let i = 0; i < L.length; i++) if (clock.t >= L[i].start - 0.4) n = i + 1;
    lnEl.textContent = "LINE " + n + " / " + L.length;
  }} }}, 0);
  tl.fromTo("#fill", {{ scaleX: 0 }}, {{ scaleX: 1, duration: TOTAL, ease: "none" }}, 0);
  // the script scrolls so the upcoming line sits on the reading guide 0.4s before it starts
  tl.set("#col", {{ y: () => GUIDE - document.getElementById("b0").offsetTop + 260 }}, 0);
  if (L.length) tl.to("#standby", {{ opacity: 0, duration: 0.3 }}, Math.max(L[0].start - 0.7, 0));
  L.forEach(function (l, i) {{
    const b = document.getElementById("b" + i);
    const at = Math.max(l.start - 0.4, 0.01);
    tl.to("#col", {{ y: () => GUIDE - b.offsetTop, duration: 0.4, ease: "power2.inOut" }}, at);
    tl.to(b, {{ opacity: 1, duration: 0.2 }}, at);
    l.words.forEach(function (w) {{ tl.set("#" + w[0], {{ color: "#ffffff" }}, w[1]); }});
    const nextAt = i + 1 < L.length ? Math.max(L[i + 1].start - 0.4, 0.01) : null;
    if (nextAt !== null) tl.to(b, {{ opacity: 0.4, duration: 0.2 }}, nextAt);
  }});
  window.__timelines["main"] = tl;
}})();
</script>
</body></html>
"""
open(os.path.join(tp, "index.html"), "w").write(page)
print(f"transcript: {len(lines)} lines → stems/transcript.(txt|srt|vtt|json)")

if args.render:
    hf = ["npx", "-y", "hyperframes"]
    for step in (["check"], ["render", "--quality", "high", "-o", os.path.join(stems, "teleprompter.mp4")]):
        r = subprocess.run(hf + step, cwd=tp, stdin=subprocess.DEVNULL, capture_output=True, text=True)
        if r.returncode:
            raise SystemExit(f"hyperframes {step[0]} failed:\n" + (r.stdout + r.stderr)[-3000:])
    print("teleprompter: stems/teleprompter.mp4")
