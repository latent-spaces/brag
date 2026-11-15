# Using /brag with other AI coding agents

The install that works for Cursor, Codex, Copilot, Gemini CLI, opencode, and anything else the [skills CLI](https://github.com/vercel-labs/skills) supports:

```bash
npx skills add https://github.com/latent-spaces/brag --skill brag
```

Add `-g` to install it for every project. For `/brag-slim` only:

```bash
npx skills add https://github.com/latent-spaces/brag --skill brag-slim
```

Codex and Claude Code can also install the plugin. See the [README](../README.md).

## If your agent has no skill installer

### Paste into custom instructions

Paste the full contents of [`skills/brag/SKILL.md`](../skills/brag/SKILL.md). For the lean workflow, paste [`skills/brag-slim/SKILL.md`](../skills/brag-slim/SKILL.md) instead.

### Point at the file

If the agent can load instructions from a path:

```text
path/to/skills/brag/SKILL.md
```

### Copy the folder

```bash
cp -R skills/brag/ ~/.your-agent/skills/brag/
cp -R skills/brag-slim/ ~/.your-agent/skills/brag-slim/
```

## Google Antigravity

Antigravity discovers skills without pasting them:

- Project: `skills/brag/` is already linked at `.agents/skills/brag/`. The same is true for `.agents/skills/brag-slim/`.
- Global: copy `skills/brag/` to `~/.gemini/config/skills/brag/`.
- Hyperframes, for the full `/brag` workflow: `npx hyperframes skills`.

## Windows

Git only materializes the discovery links as symlinks when `core.symlinks` is true (`git clone -c core.symlinks=true`) and the account can create symlinks. Otherwise copy `skills/brag/` and `skills/brag-slim/` into the agent's skill directory.

## Prerequisites

`/brag` needs:

- Node.js 22+
- FFmpeg on `PATH`
- Hyperframes: `npx hyperframes doctor`
- The skill directory, so the bundled music and SFX resolve

`/brag-slim` does not need Hyperframes or the bundled assets. It uses the tools already on the machine.
