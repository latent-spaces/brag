# Using /brag with other AI coding agents

Agents like **Cursor**, **Aider**, or any LLM with custom instructions don't have native `SKILL.md` discovery. Use one of these methods:

## Option 1: Paste into custom instructions

Open your agent's custom instructions or system prompt settings and paste the full contents of [`skills/brag/SKILL.md`](../skills/brag/SKILL.md).

## Option 2: Reference as a file path

If your agent supports loading instructions from a file, point it at:

```
path/to/skills/brag/SKILL.md
```

## Option 3: Copy the skill folder

Copy `skills/brag/` into wherever your agent looks for skill files:

```bash
cp -r skills/brag/ ~/.your-agent/skills/brag/
```

## Google Antigravity (AGY)

Antigravity natively discovers skills without manual pasting:
- **Project-level**: Symlink or copy `skills/brag/` to `.agents/skills/brag/` (or declare in `.agents/skills.json`).
- **Global-level**: Copy `skills/brag/` to `~/.gemini/config/skills/brag/` to make `/brag` accessible across all your projects.
- **Hyperframes companion skills**: Run `npx hyperframes skills` to ensure Hyperframes helper skills are installed to `~/.agents/skills` / `~/.gemini/config/skills`.

## Prerequisites

Regardless of method, the environment needs:
- **Node.js 22+**
- **FFmpeg** on `PATH`
- **Hyperframes CLI** — `npx hyperframes doctor` to verify
- **This repo cloned** (or `skills/brag/` accessible) for assets (music, SFX, reference docs)

## /promo: promos from real footage

The same three options work for `/promo`: use [`skills/promo/SKILL.md`](../skills/promo/SKILL.md), or copy `skills/promo/` into your agent's skill folder. It brings its own scripts (`scripts/footage.py`, `scripts/capture.mjs`) and render kit (`kit/`). Its bundled music links to `skills/brag/assets/music/`, so copy that folder alongside it, or give `/promo` your own track.

It needs FFmpeg with zscale, ImageMagick 6 or 7, Python 3, and Node.js 22+ with a Chromium. It installs `playwright-core` into its work folder per run. For AI fill images, add [gpt-image-bridge](https://github.com/oakplank/gpt-image-bridge) and a logged-in `codex` CLI. Without them, `/promo` works from the footage alone.
