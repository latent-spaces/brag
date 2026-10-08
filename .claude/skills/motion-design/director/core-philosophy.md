# Core Philosophy

## Three Pillars

### Pillar 1: Emotional Intent
Define target emotion before choosing any property.

| Emotion | Character | Timing | Easing |
|---------|----------|--------|--------|
| Trust | Smooth, predictable | 300-400ms | Gentle curves |
| Delight | Bouncy, surprising | 200-300ms | Overshoot |
| Urgency | Sharp, direct | 100-200ms | Snappy ease-out |
| Calm | Slow, flowing | 500-1000ms | Sine curves |
| Surprise | Sudden, explosive | 150-300ms | Exponential |
| Confidence | Direct, decisive | 200-400ms | Strong ease-out |

### Pillar 2: Visual Narrative

| Phase | Duration Share | Purpose |
|-------|--------------|---------|
| Setup | 20-30% | Establish context, prepare viewer |
| Action | 30-40% | Primary motion, hero moment |
| Resolution | 30-40% | Settle, breathe, confirm |

Even a 200ms tooltip fade has implicit setup→action→resolution.

### Pillar 3: Motion Craft
- Easing curves match emotional intent
- Duration proportional to element size and distance
- Arcs for organic, straight for mechanical
- Secondary motion (shadows, related elements)
- Nothing starts and stops all at once

## Three Motion Layers

| Layer | Role | Amplitude |
|-------|------|-----------|
| Primary | Main action viewer follows | 100% |
| Secondary | Supporting richness | 30-50% |
| Ambient | Background life | 10-20% |

- Secondary offset 50-100ms from primary, different easing
- Ambient is continuous/slow, never demands attention
- Primary-only animation feels flat; always add secondary + ambient

## The 1/3 Screen Rule
No motion travels >1/3 screen without intermediate keyframe. Break with direction changes, speed shifts, or arc adjustments.

## The Attention Budget
- One hero motion per scene moment
- Max 2-3 elements in active motion simultaneously
- Ambient doesn't count against budget
- Stagger rather than synchronize
