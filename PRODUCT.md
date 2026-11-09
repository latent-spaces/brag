# Product

## Register

brand

## Users

People building things with AI coding agents (Claude Code, Codex, Cursor, etc.) who want a faster, more fun way to share what they made than a screenshot or screen recording. Many of them post on X, LinkedIn, Discord, group chats. They have taste, they care about how the work looks, and they'd rather not spend an evening editing a video.

Secondary audience: curious onlookers who hit the page from a link in a tweet. They need to understand what `/brag` is and see proof inside of 5 seconds, or they're gone.

## Product Purpose

This site is the launchpad for `/brag` — an agent skill that turns a project website into a short, polished, shareable launch video. `/brag` uses Hyperframes. On Opus 5.5 it hands off to `/brag-slim`, which builds the video without Hyperframes. [letsbrag.app](https://letsbrag.app) runs the same job for someone who pastes a link. The site exists to:

1. Show the output (real brag videos for real example projects), not describe it.
2. Make the install command impossible to miss.
3. Convince builders that `/brag` is worth the 30 seconds it takes to try.

Success looks like: a visitor watches at least one brag video, copies the install command, and runs `/brag` on their own project the same day.

## Brand Personality

Confident, playful, ridiculous. The site is brag-ing about brag — it has to walk the walk. Earnest about quality, deliberately over-the-top in delivery. Says big things with a straight face. The joke is that the work backs it up.

Three words: **confident, playful, ridiculous.**

Voice references in the right lane: Linear/Vercel craft level, Vercel Ship launch-page energy, Cluely's "look at this" confidence, PostHog's "we hate marketers" tone, indie editorial / zine pages (Are.na vibe).

## Anti-references

What this should NOT look like:

- Generic dev-tool landing page (Linear/Vercel **clone**, without their craft). No identical hero + 3 feature cards + testimonial grid.
- AI-startup gradient meshes, glowing blobs, abstract "intelligence" graphics.
- GitHub-style docs sites or README-as-website.
- Hero-with-feature-grid SaaS template energy. No "Streamline your workflow."
- Enterprise tone. No "elevate", no "supercharge", no "unlock".

## Design Principles

1. **Practice what you preach.** The site is itself a brag. If a visitor screenshots any frame of it, that frame should be postable.
2. **Show, don't tell.** Videos and demo sites do the explaining. Copy stays short and specific.
3. **Land the joke fast.** Same as a brag video: the first 2 seconds decide whether someone stays. Lead with personality, not a feature list.
4. **Specific over generic.** Every word, every visual detail belongs to `/brag` specifically, not to "any AI tool." The example videos are the strongest asset — give them real space.
5. **Taste over template.** No reflexive "modern SaaS" layout decisions. The page should feel made, not generated.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast minimums.
- Respect `prefers-reduced-motion`: videos do not autoplay when the user has reduced-motion set; show a poster frame and a play button instead.
- Keyboard navigable: every video, link, and CTA is reachable and operable via keyboard, in a logical order.
- Semantic HTML (`<main>`, `<section>`, `<article>`, `<button>`); skip-to-content link.
- Captions and audio are optional for brag videos — provide visible controls so muted/unmuted is the user's choice.
