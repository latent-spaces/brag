# brag desktop

A local desktop-style UI for the [`/brag`](../README.md) skill. Pick a project, choose a preset or tone, and
watch the agent plan, compose and render a short launch video, then play it, copy the share text, and refine it.

It does not call any API itself. It drives the `claude` CLI you are already signed in to
(`claude -p --output-format stream-json`), so runs use your **Claude Code subscription**.

> Not affiliated with the upstream project. This is a companion app that lives in a fork.

## What it does

- **Presets gallery:** 15 video types (launch, ads, marketing, onboarding, demo, creative). Each one fills in
  tone, format, length and audio, and adds a beat-by-beat structure to the prompt. Three have a real `/brag`
  sample to play; the rest have an interactive storyboard.
- **All of `/brag`'s options:** tone cards, format, duration, music, SFX, voiceover, model, full workflow.
- **Live run view:** step tracker, elapsed time, agent log, cancel, and follow-up messages (`--resume`) to refine
  a video in the same session.
- **Results:** inline video player, share copy, open folder, and run history that survives restarts.
- **Accessible:** keyboard-operable, labeled landmarks, live-region announcements, light and dark themes,
  reduced-motion support, and a drawer navigation on narrow windows.

## Requirements

- Linux with Node.js 22+ (no npm dependencies)
- [Claude Code](https://claude.com/claude-code), signed in with your subscription (`claude auth status`)
- `ffmpeg` and `git` on `PATH`
- Chrome or Chromium for the app window (falls back to `xdg-open`)

## Install and run

```bash
cd desktop
./install.sh        # adds a "brag" app-menu entry and a brag-desktop command (no sudo)
brag-desktop        # or: node server.js, then open http://localhost:4178
```

On first launch, click **Install Brag**. It clones the skill into `~/.local/share/brag-desktop/brag` and
checks out the commit this app was audited against (`669ab92`). The skill is loaded per run with
`--plugin-dir`, so nothing is written to `~/.claude`.

## How it keeps things safe

- The server binds to `127.0.0.1` only and checks the `Host` and `Origin` headers, so a web page cannot start
  runs or read files.
- `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` are removed from the agent's environment, so it always uses the
  subscription login and never bills an API key.
- By default the agent may only use a short allowlist of tools (`npx`, `ffmpeg`, `uv run`, file operations and a
  few read-only helpers). **Auto-approve everything** is opt-in per run, asks for confirmation, and is never
  remembered.
- Videos are served only from a run's own output folder.
- Be aware that the agent runs `npx hyperframes`, which downloads [Hyperframes](https://hyperframes.heygen.com/)
  from npm, and Hyperframes prints a usage-data notice. Review it if that matters to you.

## Files

| Path | Purpose |
|---|---|
| `server.js` | HTTP server, run lifecycle, prompt building, safe file serving |
| `presets.js` | Preset library (single source of truth) and the prompt block for each preset |
| `public/` | The UI (`index.html`, `style.css`, `app.js`) and sample videos |
| `bin/brag-desktop`, `install.sh` | Launcher and app-menu installer |
| `test-presets.mjs` | Self-check for the preset data (`node test-presets.mjs`) |

State lives outside the repo, in `~/.local/share/brag-desktop/` (run history, logs, the cloned skill, staged
audio, and the app window's browser profile). Set `BRAG_PORT` to change the port (default `4178`).

## Credits

Sample videos in `public/samples/` are real `/brag` outputs for fictional products, re-encoded to 720p.
Music: "Happy Beats / Business Moves" by Sascha Ende ([ende.app](https://ende.app/en)), CC BY 4.0.
Sound effects: [Kenney](https://kenney.nl/), CC0. See `public/samples/CREDITS.txt`.
