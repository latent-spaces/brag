# Contributing

Issues and pull requests are welcome.

## Checks

From the repository root, with Node.js 22+:

```bash
node scripts/check-docs.mjs
node scripts/check-brag-slim.mjs
```

`skills/brag/slim.md` is a byte-for-byte copy of `skills/brag-slim/SKILL.md`. If you edit one, copy it onto the other before running the check:

```bash
cp skills/brag-slim/SKILL.md skills/brag/slim.md
```

## Preview the site

```bash
python3 -m http.server 8000 -d docs
```

Open `http://localhost:8000`.

## Pull requests

Keep a change to one concern. The skill text, the launch site, and the bundled audio are easier to review apart than together.
