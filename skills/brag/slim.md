---
name: brag-slim
description: Turn a project directory or a website URL into a short, shareable launch video with music, motion, and share copy. One file, no bundled assets — built entirely by the model with the tools already on the machine. Use when someone says "/brag-slim", "let's /brag about this", "brag about a url", "make a launch video", or wants to show off what they built. If the /brag skill is also installed, let /brag handle those phrases; it hands off here on Opus 5.5.
---

# /brag-slim

You built it. Now brag. You make the whole video yourself — story, visuals, audio, render — with whatever tools are on the machine.

Whatever the tone, it should feel like a modern, slick, polished launch video: nothing on screen or in the soundtrack that doesn't earn its place.

Usage: `/brag-slim [input] [options]`. Options (flags or plain language):

| Option | Default |
|---|---|
| `--tone <preset or freeform>` | inferred; `default` if nothing clearly fits |
| `--format landscape\|vertical\|square` | landscape (1920×1080; vertical 1080×1920, square 1080×1080), 30fps |
| `--duration <s>` | about 20s |

Write the deliverables to `brag-output/` in the current directory (timestamped `brag-output-YYYY-MM-DD-HHmmss/` if it already exists). Keep every intermediate file (frames, downloads, scripts, stems) in a `work/` subfolder inside it.

## 1. Inspect

First decide what the input is, then gather material from it. Only the source changes; everything from the questions below onward is the same for every input.

| Input | How to recognize it | Where the material comes from |
|---|---|---|
| Project | No input given, and the current directory is a project | The code |
| Website | An `http(s)://` URL, or a bare domain like `example.com` | The live site |

If the input matches no type, or there's no input and the current directory isn't a project, ask the user what to brag about.

### Project

Read the code: the main page, styles (exact colors and fonts), README, routes and key components. The best material is the product **in use** — find its 2–3 beats: entry → key action → result.

You have the source, so use it directly: import or render the project's real components, stylesheets, fonts, images and animations in the video instead of rebuilding them.

### Website

Get the site as a visitor sees it. Many sites build their page with JavaScript, so a plain download can come back as an almost empty shell. If it does, load the page in a headless browser to get the rendered result. Dismiss cookie banners and other overlays, and scroll section by section, since content that animates in on scroll stays blank in a single full-page capture.

- **Copy:** headline, tagline, section headings, feature names, calls to action, testimonials. Also check the title, meta description and social-preview tags.
- **Identity:** exact colors from the site's CSS and the fonts it loads.
- **Visuals:** the logo, product screenshots, hero images, demo videos. Download the ones you'll use into `work/`.
- **Screenshots:** capture the page at the video's aspect ratio to understand the layout. In the video, reuse the site's real markup, CSS and assets and animate those, rather than panning over flat screenshots.
- **The product in use:** check the demo videos, how-it-works sections and linked docs for the entry → key action → result flow.

### Then, for every input

Before planning, answer: What is it (one sentence)? Who is it for, and what does it do for them? What sets it apart? What's the most impressive or funniest claim? What's the visual hook? What real UI or flow should be shown? What tone fits? What's the one-line share caption?

## 2. Plan

Write `brag-plan.md`: the angle, the hook, 2–3 highlights, the punchline, tone, visual identity, and a scene-by-scene storyboard with durations that sum to the target.

If the user points at one part — a new version, a new feature, one angle — make this the focus of the video.

**Shape:** Hook (2–3s) → Reveal (2–4s) → 2–3 sharp highlights → Punchline/outro (2–4s). A starting shape, not a template.

## Creative laws

- **Short.** 15–25 seconds; 18–22 is the sweet spot.
- **Clear to a stranger.** After one viewing, someone who's never heard of it knows what it does, who it's for, and how to get it. Lead with that, not with how it's built.
- **The hook is everything.** The first 2 seconds decide whether anyone keeps watching. Plan it first.
- **Show the thing.** Reuse the real thing from the source — its UI, components, copy, images, videos and animations — rather than re-creating it. Rebuild only what you can't reuse. Prefer the working app doing its job over a landing page describing it. Small illustrative UI text is fine when showing the product in use (a filename, an "Exported" toast); invented claims, numbers, or testimonials are not. Never abstract filler.
- **Specific.** It must feel made for this exact project. Use its own copy and claims; no generic SaaS language ("streamline your workflow" is banned).
- **Readable.** Pace comes from motion and cuts, not from pulling text away early. Any line the viewer is meant to read stays fully visible and settled long enough to read it (roughly 0.3s per word), counted from when the whole line is on screen. Text that's only texture doesn't need to be read.
- **Make it alive.** Things that appear one by one, simulated clicks, swipes, and typing beat static slides.
- **Funny earns its place.** Humor comes from the project's own absurdity, not from trying.
- **Every frame postable.** Any frozen frame should be worth sharing.

## Tones

Presets are defaults; freeform direction ("fake Series A launch from 2016") refines or overrides them.

| Tone | Feel | Pacing / transitions |
|---|---|---|
| `default` | Punchy, playful, clean | 4–5 scenes; soft transitions |
| `polished` | Serious, elegant, restrained | 3–4 scenes, long holds; soft fades |
| `yc-parody` | Deadpan startup launch, played straight | 4–5 scenes, one claim each; hard cuts |
| `chaotic` | FAST, LOUD, ALL CAPS | 6–8 scenes, some under 2s; flash/zoom cuts |
| `deadpan` | Calm, dry, nothing is a joke | 3–4 scenes, big empty space; slow fades |
| `cinematic` | Trailer-scale, epic claims | 4–5 scenes, big type; dramatic wipes |
| `app-store` | Clean feature cards | 4–6 scenes; smooth slides |

## Sound

Write the music and sound effects as one piece: effects in the same key and the same space as the music, blended in rather than laid on top. Give it a basic, proper mix, the way a real track is mixed: effects sit softly under the music, nothing harsh or spiky, and repeated little sounds stay in the background.

## 3. Build, check, render

Build it with whatever works on this machine. If you draw the video in a browser, make every frame a pure function of time and wait for fonts and images to load before capturing each one.

Before the full render, look at stills from every scene *and* from mid-transition, and fix overflow, collisions, and low contrast. A plain crossfade between two busy layouts makes a muddy double exposure; stagger it (old content out, then new content in) or dip through the background. Then render `brag.mp4`.

## 4. Deliver

- **Poster:** pull the strongest *settled* frame (text fully in, not mid-transition) to `brag.jpg`, and bake it in as frame 0 of `brag.mp4` so every platform's thumbnail shows it. Replace frame 0 rather than adding a frame, so the duration and audio sync stay the same.
- **`share-copy.txt`:** 1–3 sentences, postable as-is, specific, matching the tone. No "excited to share."
- **Tell the user** where the video and copy are, give one sentence on the creative angle, and offer to re-roll a scene or try another tone.
