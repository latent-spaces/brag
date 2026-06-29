# Step 1: Inspect the project

Read the project directory to understand what you're bragging about.

Two complementary approaches work together:

1. **Static file analysis** (below) — read the source code, HTML, CSS, routes
2. **Browser inspection** via `playwright-cli` (see [playwright-inspect.md](playwright-inspect.md)) — open the project in a real browser, navigate pages, interact with UI, capture screenshots

The browser pass is preferred when the project has a runnable frontend. It reveals the actual rendered UI, computed styles, interactive flows, and gives you screenshots that serve as visual references for the Hyperframes composition. The static pass ensures you don't miss copy, structure, or details behind dynamic rendering.

Start by checking if a dev server is running or can be started. If `--no-browser` is not passed, run the browser inspection first (it's faster to understand a visual product visually), then read the source for exact copy and structure.

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

## Voiceover script draft

After answering the 9 questions, draft a short voiceover script. This is a spoken summary of the project — concise, specific, and tone-matched. It will be passed to ElevenLabs TTS in Step 3.

Guidelines:
- **Length:** 40–70 words (~15-25 seconds spoken).
- **Structure:** What the project is → the hook → 2-3 highlights → tagline/outro.
- **Voice:** Match the tone preset. `default` is warm and direct; `yc-parody` is deadpan serious; `chaotic` is punchy.
- **Read aloud test:** Say it out loud. If it feels natural, it's ready. If it stumbles, trim it.

Example (`default` tone for Horse Tinder):
> Dating apps were built for humans. Obvious mistake. Horse Tinder connects riders with their perfect match — swipe through eligible horses near your pasture. Real profiles. Real neighs. Find your stablemate today.

Write this draft alongside the rubric answers. It will be refined and finalized in Step 2.

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

These colors carry into the Hyperframes composition's DESIGN.md.

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

