# Choreography

## Coordinated Entry Rules

### 1. Lead with the Hero
- Hero gets largest displacement and most attention-grabbing easing
- Supporting elements are subtler in every dimension

### 2. Spatial Origin Consistency
All elements enter from same direction or shared origin. Mixed directions = chaos.

### 3. Counter-Motion

| Hero Motion | Counter-Motion | Speed Ratio |
|-------------|---------------|-------------|
| Enters left | Background shifts right | 20-30% |
| Scales up | Shadow scales down | 10-20% |
| Rotates CW | Ambient drifts CCW | 15-25% |
| Lifts (Y up) | Shadow spreads + softens | 20-30% |

## Sequence Structure

| Phase | Duration Share | What Happens |
|-------|--------------|-------------|
| Setup | 20-30% | Elements enter, scene establishes |
| Action | 30-40% | Primary motion, hero moment |
| Resolution | 30-40% | Settle, secondary reactions, breathing |

Leave 100-200ms stillness after resolution before new motion.

## The 1/3 Rules

**Distance**: No motion travels >1/3 screen without intermediate keyframe. Break with direction changes, speed variations, or arc adjustments.

**Elements**: With 3+ animated elements, max 1/3 active simultaneously. Stagger so element 1 settles as element 3 starts.

## Stagger Patterns

| Pattern | Description | Best For |
|---------|------------|----------|
| Sequential | Reading order | Lists, grids |
| Center-out | Radiating from center | Hero content, ripples |
| Random | Varied timing | Organic, particle-like |
| Wave | Sine-based | Data bars, continuous |
| Reverse | Bottom-to-top | Exits, backward nav |

- All staggered elements use same easing family
- Vary only start time, not curve
- Optional: last element gets slight overshoot (punctuation)

## Shared Motion Events

When multiple elements react to one trigger:
- All start within 50ms of each other
- Can arrive at different times (staggered landing)
- Same easing family; motion originates from trigger point

## Attention Direction

| Technique | Implementation |
|-----------|---------------|
| Leading motion | Animate target before context |
| Following motion | Settle on focal point |
| Ambient motion | Subtle continuous in periphery |
| Pointing motion | Directional toward CTA |

### Depth Through Speed

| Layer | Displacement | Speed |
|-------|-------------|-------|
| Foreground | 1.0x | Fastest |
| Midground | 0.5x | Medium |
| Background | 0.2x | Slowest |

## Common Recipes

### Dashboard Load
1. Skeletons fade in (100ms)
2. Hero metric (250ms, ease-out, 100ms delay)
3. Supporting cards stagger (50ms between, 200ms each)
4. Chart data draws in (300ms, starts with cards)
5. Ambient pulse on primary metric

### Modal Open
1. Background dims (200ms)
2. Modal scales 95%→100% + fades (300ms, 50ms delay)
3. Content fades in (200ms, 100ms after modal)
4. Close button last (150ms)

### List Update (item added)
1. Existing items shift down (200ms, ease-in-out)
2. New item fades+slides from top (250ms, ease-out, 50ms delay)
3. Subtle scale overshoot on land (3-5%)
