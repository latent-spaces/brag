# Emotion-to-Motion Mapping

## Core Table

| Emotion | Character | Path | Easing | Duration |
|---------|----------|------|--------|----------|
| Joy/Delight | Bouncy, arcs, overshoot | Curved, upward | ease-out-back | 200-400ms |
| Calm/Serenity | Smooth, flowing | Gentle curves | sine ease-in-out | 500-1000ms |
| Urgency/Alert | Sharp, fast, direct | Straight lines | ease-out | 100-200ms |
| Sadness/Weight | Slow, downward | Drooping curves | cubic ease-in-out | 600-1200ms |
| Surprise/Impact | Sudden, expanding | Radial outward | ease-out-expo | 150-300ms |
| Elegance/Grace | Slow, controlled | Long smooth arcs | (0.4, 0, 0.2, 1) | 400-700ms |
| Playfulness | Bouncy, irregular | Arcs, squiggly | ease-out-back | 200-350ms |
| Confidence | Direct, decisive | Straight, horizontal | ease-out | 200-400ms |
| Curiosity | Exploratory, varied | Mixed, circular | varied | 300-500ms |
| Tenderness | Soft, gentle | Very subtle curves | soft ease-in-out | 600-1000ms |

## Path as Emotional Language

| Path Type | Connotation |
|-----------|------------|
| Angular/sharp | Tense, urgent, mechanical |
| Curved/smooth | Relaxed, friendly, organic |
| Spiral | Playful, whimsical |
| Straight diagonal | Dynamic, purposeful |
| Vertical up | Growth, achievement |
| Vertical down | Settling, gravity |
| Horizontal | Journey, progress |
| Radial outward | Explosion, release |
| Radial inward | Focus, convergence |

## Emotional Intensity

| Intensity | Characteristics | When |
|-----------|----------------|------|
| Low | Subtle opacity, tiny shifts | Ambient, routine |
| Medium | Visible but not demanding | Most UI interactions |
| High | Demands attention, large displacement | Errors, celebrations, onboarding |

## Color Psychology

| Color | Emotion | Animation Pairing |
|-------|---------|------------------|
| Blue | Trust, calm | Smooth, medium transitions |
| Green | Success, growth | Upward, expansion, gentle overshoot |
| Red | Alert, urgency | Sharp, fast, horizontal shakes |
| Orange | Energy, warmth | Bouncy, diagonal paths |
| Purple | Premium, mystery | Slow reveals, elegant easing |
| Yellow | Optimism, caution | Quick pulses |
| Teal | Modern, clarity | Clean, snappy transitions |

### Color Transition Rules
- Success: transition TO green (don't start with it)
- Error: flash red then settle (don't sustain)
- Warning: pulse yellow/amber for urgency
- Neutral: use opacity rather than color change

## Context-Based Emotion Defaults

| Context | Default Emotion |
|---------|----------------|
| Form success | Joy + Confidence |
| Validation error | Mild urgency |
| Page load | Calm + Confidence |
| Navigation | Confidence |
| Notification | Mild surprise |
| Loading | Calm |
| Onboarding | Curiosity + Delight |
| Dashboard | Calm + Confidence |
| Purchase complete | Joy + Confidence |
| Delete/remove | Calm (respectful departure) |
