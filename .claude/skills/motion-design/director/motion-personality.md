# Motion Personality

## Four Archetypes

### Playful

| Parameter | Value |
|-----------|-------|
| Duration | 150-300ms |
| Easing | ease-out-back / bouncy springs |
| Overshoot | 10-20% |
| Paths | Arcs and curves, never straight |
| Squash-stretch | Yes, on impacts |

Signature: bounce settle, squash-stretch on press, rotation wobble, bright color pops, varied stagger timing.
Use for: children's apps, casual games, social media, celebrations, onboarding, creative tools.

### Premium / Luxury

| Parameter | Value |
|-----------|-------|
| Duration | 350-600ms |
| Easing | cubic-bezier(0.4, 0, 0.2, 1) |
| Overshoot | 0% |
| Paths | Smooth curves, subtle parallax |
| Squash-stretch | Never |

Signature: slow fades, subtle scale (98%→100%), generous pauses, minimal properties (opacity+one), ultra-smooth.
Use for: fashion, finance, luxury brands, premium SaaS, portfolios, editorial.

### Corporate / Professional

| Parameter | Value |
|-----------|-------|
| Duration | 200-400ms |
| Easing | cubic-bezier(0.2, 0, 0, 1) |
| Overshoot | 0-3% |
| Paths | Mostly straight, small arcs for emphasis |
| Squash-stretch | No |

Signature: consistent timing, clear state transitions, functional motion, predictable patterns, uniform stagger.
Use for: enterprise, dashboards, business tools, admin, healthcare, banking.

### Energetic / Dynamic

| Parameter | Value |
|-----------|-------|
| Duration | 100-250ms |
| Easing | ease-out-expo / elastic |
| Overshoot | 15-30% |
| Paths | Dramatic arcs, large displacement, diagonal |
| Squash-stretch | Yes, exaggerated |

Signature: large scale changes (50-150%), fast color transitions, particle bursts, accelerating stagger, bold edge entrances.
Use for: gaming, sports, music, events, marketing, fitness apps.

## Keyword Matching

| Keywords | Archetype |
|----------|-----------|
| fun, whimsical, bouncy, cute, friendly | Playful |
| elegant, minimal, luxury, sophisticated | Premium |
| clean, professional, business, dashboard | Corporate |
| dynamic, energetic, bold, exciting | Energetic |
| (unspecified) + UI | Corporate (default) |
| (unspecified) + illustration | Playful (default) |

## Brand Motion Identity

Define three constants for recognizable motion:

### 1. Signature Easing (80% of animations)
Playful: ease-out-back | Premium: (0.4,0,0.2,1) | Corporate: (0.2,0,0,1) | Energetic: ease-out-expo

### 2. Duration Palette

| Tier | Playful | Premium | Corporate | Energetic |
|------|---------|---------|-----------|-----------|
| Quick | 150ms | 350ms | 200ms | 100ms |
| Standard | 250ms | 500ms | 300ms | 180ms |
| Slow | 400ms | 800ms | 450ms | 300ms |

### 3. Entrance Pattern
Playful: bounce up from below | Premium: slow fade + scale 98%→100% | Corporate: slide right + opacity | Energetic: snap from edge + overshoot

## Mixing Archetypes
- 90% primary archetype; specific moments can borrow another
- Ease into personality shifts, don't snap
- Example: corporate dashboard borrows Playful for success state only
