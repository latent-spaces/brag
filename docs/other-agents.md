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
