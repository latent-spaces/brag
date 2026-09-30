# /brag

**You built it. Now brag.**

[![the /brag launch site — you built it, now brag](docs/assets/hero.png)](https://latent-spaces.github.io/brag/)

`/brag` is a Claude Code skill that turns the project you created into a short, shareable launch video — music, motion, and share copy included. One command, powered by [Hyperframes](https://hyperframes.heygen.com/).

The looping video on the [launch site](https://latent-spaces.github.io/brag/) was made by `/brag` on this very repo. 

## New: `/brag-slim`

**The same /brag, rebuilt lean for Opus 5.5.**

A smooth launch video, designed for your specific project, with its own soundtrack and share copy.

No Hyperframes, no bundled assets, same creative rules.

Just tell Opus 5.5: *let's /brag about this.*

On Opus 5.5, `/brag` switches to `/brag-slim` automatically. Run `/brag --full` to keep the classic Hyperframes workflow.

**Install just `/brag-slim`:**

```bash
npx skills add https://github.com/latent-spaces/brag --skill brag-slim
```

Already have the `/brag` plugin? `/brag-slim` is included from version 0.4.0. Run `claude plugin update brag` to get it.

## New: `/promo`

**Shot it instead of coding it? Brag anyway.**

`/promo` edits real footage. Point it at a folder of photos and videos (plus an optional brief) and it cuts a short promo with music, on-screen text in any language, a poster and a caption.

- **Reads phone media as it comes.** HEIC photos, rotated portrait clips, HDR video, Display P3 colour, odd camcorder formats. It looks at contact sheets rather than every file, so a big folder stays cheap.
- **Cuts like an editor.** It picks the sharpest, steadiest moments, avoids cuts inside a clip, cuts on the music's beats, and gives every person in the footage a moment when you ask.
- **Words you can stand behind.** Text comes only from your brief, the footage or your own website. No invented prices, stats or testimonials, and third-party logos are kept out of frame.
- **Any language.** It handles right-to-left and joined scripts (Persian, Arabic), keeps numbers and URLs readable inside them, and turns off letter-spacing.
- **One timeline, every format.** Vertical by default, and landscape or square from the same plan.
- **Optional AI fill.** With [gpt-image-bridge](https://github.com/oakplank/gpt-image-bridge) and a logged-in `codex`, it can generate clearly illustrative plates (say, a route map behind a services card), graded to sit with the footage and labelled in the caption.

```text
/promo ~/Desktop/opening-night
/promo ~/media/cafe --tone premium --lang fa
/promo . --format landscape --music ./track.mp3 --no-ai
```

**Install just `/promo`:**

```bash
npx skills add https://github.com/latent-spaces/brag --skill promo
```

Inside the `/brag` plugin, `/promo` uses brag's bundled music. A standalone install uses a track you give it.

## Install /brag

```bash
/plugin marketplace add latent-spaces/brag
/plugin install brag@brag
```

Then run `/brag` inside any project. The plugin includes `/brag-slim` and `/promo` too.

**Any other agent** — one command via the [`skills`](https://github.com/vercel-labs/skills) CLI (Cursor, Codex, Copilot, Gemini CLI, opencode, and more):

```bash
npx skills add https://github.com/latent-spaces/brag --skill brag
```

Add `-g` to install globally (available in every project); drop it to scope to the current one. ([browse on skills.sh](https://www.skills.sh/latent-spaces/brag/brag))

<details>
<summary>No installer? Copy the skill directly.</summary>

```bash
rsync -a --exclude '.DS_Store' skills/brag/ ~/.claude/skills/brag/
rsync -a --exclude '.DS_Store' skills/brag-slim/ ~/.claude/skills/brag-slim/  # optional: the /brag-slim command
```

Restart Claude Code after copying.
</details>

### Also works with

This repo exposes the skill at every agent's standard discovery path via symlinks. No extra config needed.

| Agent | How it discovers |
|---|---|
| **Google Antigravity** | Auto-detects from `.agents/skills/brag/` at project root or `~/.gemini/config/skills/brag/` globally |
| **opencode** | Auto-detects from `.opencode/skills/brag/` at project root |
| **Codex CLI** | Reads `.agents/skills/brag/`, walking up to repo root |
| **Claude Code** | Also reads `.claude/skills/brag/` (in addition to the `.claude-plugin/` marketplace install above) |
| **Other agents** | Point custom instructions at `skills/brag/SKILL.md` — see [`docs/other-agents.md`](docs/other-agents.md) |

> **Windows users:** Git requires `git config core.symlinks true` (or `git clone -c core.symlinks=true`) and Windows Developer Mode or Administrator privileges to create symlinks. If symlinks don't work on your system, copy `skills/brag/` to the agent's skill directory manually instead.

## Use it

From any project directory, ask your agent:

```text
let's /brag
```

Or steer the tone:

```text
/brag --tone "fake Series A launch from 2016"
```

Voiceover is off by default. Enable it explicitly with:

```text
/brag --voice
```

Narration uses Kokoro through Hyperframes when enabled.

You get a `brag-output/` folder with the plan, a composition brief, share copy, and the rendered `brag.mp4`.

## How it works

`/brag` owns the story — the product angle, tone, and which moments to show. It hands a focused brief to [Hyperframes](https://hyperframes.heygen.com/), which builds, times, and renders the video.

## Requirements

- An agent that supports Agent Skills — Claude Code, opencode, Codex CLI, or any agent with custom instructions (see "Also works with" above)
- Node.js 22+
- FFmpeg on `PATH`
- Hyperframes CLI — `npx hyperframes` (check it with `npx hyperframes doctor`)

`/promo` needs FFmpeg with zscale, ImageMagick 6 or 7, Python 3, Node.js 22+ and a Chromium (it installs `playwright-core` per run). Optional: [gpt-image-bridge](https://github.com/oakplank/gpt-image-bridge) and the `codex` CLI for AI fill images.

## What's in this repo

- `skills/brag/` — the skill, references, and bundled music + SFX
- `skills/brag-slim/` — `/brag-slim`, the single-file skill for Claude Opus 5.5
- `skills/promo/` — `/promo`: footage tools, capture script and render kit for promos from real footage
- `tests/promo/` — `/promo` self-checks (`python3 tests/promo/test_footage.py`, `bash tests/promo/test_capture.sh`, `bash tests/promo/test_kit.sh`)
- `examples/` — fake product sites used as a benchmark suite
- `docs/` — the launch site (GitHub Pages)
- `.claude-plugin/` — plugin manifest + marketplace catalog
- `.claude/skills/brag/` — symlink → `skills/brag/` (Claude Code discovery)
- `.agents/skills/brag/` — symlink → `skills/brag/` (Codex CLI + opencode discovery)
- `.opencode/skills/brag/` — symlink → `skills/brag/` (opencode discovery)
- `.claude/skills/promo/`, `.agents/skills/promo/`, `.opencode/skills/promo/` — the same discovery symlinks for `/promo`

## Credits

- Music — [ende.app](https://ende.app/en) "Happy Beats / Business Moves"
- Sound effects — [Kenney](https://kenney.nl/)
- Video generation — [Hyperframes](https://hyperframes.heygen.com/)
- Fake demo sites — built with [Impeccable](https://impeccable.style/)

## Contributing

Contributions, ideas, and new demo brags are welcome — open an issue or a PR.

## Star History

<a href="https://www.star-history.com/?type=date&repos=latent-spaces%2Fbrag">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=latent-spaces/brag&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=latent-spaces/brag&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=latent-spaces/brag&type=date&legend=top-left" />
 </picture>
</a>