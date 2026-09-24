# Step 1: Inspect the project

Read the project directory to understand what you're bragging about.

## PR mode: inspect the change, not the product

If `--pr` was passed, [pr-mode.md](pr-mode.md) owns this step. Read it instead of the
priority list below, and answer the PR rubric instead of the 9-question rubric.

Two parts of this file still apply in full, because a PR demo has to look like the real
product: **color extraction** and **font extraction**. Pull those from the project's
CSS exactly as described below, even when the PR never touched a stylesheet.

Everything else narrows to the diff — the changed files at head, the same files at
base, and the screens that render them. Do not inventory the whole project.

## What to look for

Read these in priority order:

1. **`index.html`** — the primary source. Read the full file. Extract: page title, hero headline, tagline, all section headings, CTA text, testimonial copy, nav items. This is the voice and story of the app.

2. **`styles.css`** or equivalent — extract: primary color palette (look for CSS custom properties / `:root` vars), font families, background colors, accent colors. These become the visual identity of the brag video.

3. **`README.md`** — if present, extract: project name, one-line description, any listed features.

4. **`package.json`** — if present, extract: `name`, `description`.

5. **Subdirectory files** — if this is a multi-page app, scan route files, component files, or page files. Extract key feature names and screen descriptions.

6. **The user flow / happy path** — scan beyond marketing pages. The brag's strongest material is usually the product *in use*, not the product's marketing of itself. Look at:
   - **Routes** (`app/`, `pages/`, route files) — the screens beyond the landing page.
   - **Key feature components** — the upload form, the editor, the result view, the dashboard.
   - **State machines, stores, or step components** — how a session progresses.
   - **README "how it works" or "usage" sections** — the project's own description of the flow.
   - **Example or demo folders** — sample inputs and outputs the team tested with.

   Identify the 2–3 beats of *using* the product: **entry → key action → result.**

7. **`public/` or `assets/`** — note any images, logos, icons. These can be referenced in the composition.

## The 9-question rubric

After reading, answer all nine. Write these down before moving to Step 2.

```
1. What is the app?
   One sentence. What does it actually do (or claim to do)?

2. What is the funniest or most impressive claim?
   The one line from the site that earns a reaction.

3. What is the visual hook?
   The strongest CSS visual: a color palette moment, a UI element, a diagram, a card.

4. What should be shown from the actual UI?
   Which section of the site has the most video-worthy content?
   (Hero? Feature section? Testimonial? The UI mockup?)

5. What is the shortest satisfying video?
   Would 15 seconds work? 20? What's the minimum to land the joke/claim?

6. What tone fits best?
   If the user specified a preset, use it.
   If the user gave freeform direction, preserve it and map it to the nearest preset.
   If the user did not specify, infer both:
   - Tone preset: one of the known presets
   - Creative direction: a short custom phrase for this project
   Examples:
   - Absurd product → preset: yc-parody; direction: fake startup launch
   - Earnest product → preset: polished; direction: quiet premium product film
   - Chaotic product → preset: chaotic; direction: overproduced social ad

7. What should the audio feel like?
   Decide the audio role and music direction before picking exact SFX files.
   Bias toward a polished audio layer: include music and tasteful SFX unless
   the user disabled them, assets are missing, or silence is clearly the
   strongest creative choice.
   Examples:
   - Warm corporate bed; SFX chosen later to match real UI motion
   - Low music bed with final fade; one dry logo hit if the composition supports it
   - Dense chaotic music; Hyperframes may align text/card reveals to beats
   - Cinematic bed with a low swell, restrained motion-matched accents, and subtle audio-reactive glow/presence if it supports the visual style

8. What should the share caption say?
   Draft one sentence. This becomes share-copy.txt.

9. What's the user flow worth showing?
   The 2–3 beats a real user goes through: entry → key action → result.
   Not the landing page's section list — the working app.
   Examples:
   - Upload long video → see it processing with progress → see 3 vertical clips ready
   - Type a message → assistant types back → user clicks "mark resolved"
   - Swipe right on Thunder's profile → match animation → chat opens
   If the project is a landing-page-only static site with no app, write
   "none — landing-page only" and rely on the strongest visual (Q3) instead.
```

## Color extraction

When reading CSS, look for custom properties like:

```css
:root {
  --primary: oklch(...);
  --bg: oklch(...);
  --accent: ...;
}
```

If no custom properties exist, scan for the most-used colors in background, color, and border rules.

Write down:
- Background color (exact value)
- Primary text color
- Accent/brand color
- Any gradient or special treatment

These colors are recorded in `composition-brief.md` and carry into the design spec the current hyperframes-creative workflow scaffolds.

## Font extraction

Look for:
- `font-family` declarations in `:root` or `body`
- Google Fonts `<link>` in `<head>` (the font families are in the URL query string)
- `@import` statements

Write down the display font (used for headings) and the body font separately.

## What to skip

Don't read:
- Generated build artifacts (`dist/`, `.next/`, `build/`)
- Lock files (`package-lock.json`, `yarn.lock`)
- Test files
- `.git/`
- Environment and secret files (`.env`, `.env.*`)
- Credential and key material (`.pem`, `.key`, `id_rsa`, service-account JSON, anything under a `secrets/` or `credentials/` directory)
- Local config that commonly holds tokens
- Any file the project's `.gitignore` excludes for the reasons above

## Rule: nothing secret leaves this step

Everything read in this step can end up on screen in a video the user posts publicly. Never carry secrets, API keys, tokens, internal hostnames or URLs, real customer or user names, email addresses, or any personal data into `brag-plan.md`, `composition-brief.md`, the composition, the rendered video, or share copy. If the product's real UI contains such data, substitute plausible fictional stand-ins and say so in the plan.

