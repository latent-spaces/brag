# State & Feedback Patterns

## Button Press

### Playful
- Press: scale 0.95 (60ms, ease-out); Release: overshoot 1.05 (80ms); Settle: 1.0 (120ms, spring)
- Secondary: shadow shrinks/grows; color darkens/brightens. Total ~260ms

### Premium
- Press: scale 0.98 (80ms); Release: 1.0 (150ms, no overshoot)
- Opacity dims to 90% on press. Total ~230ms

### Corporate
- Press: scale 0.97 (60ms); Release: 1.0 (100ms); overshoot 0-2%
- Background darkens 10%. Total ~160ms

## Hover States

| Element | Effect | Duration |
|---------|--------|----------|
| Button | Scale 1.02-1.05 | <100ms |
| Card | Scale 1.01-1.02 + shadow lift | <100ms |
| Link | Color change + underline | <100ms |
| Icon | Scale 1.1 + rotation 2-5° | <100ms |
| Image | Scale 1.03 (overflow hidden) | 150ms |

Hover enter <100ms; hover exit 150-200ms (slower = polished).

## Toggle / Switch
- Thumb slides (120-180ms, ease-in-out); track color transitions simultaneously
- Slight squash in movement direction
- Playful: bounce at destination; Premium: smooth, no overshoot

## Success State

### Checkmark Success
1. Container: scale 0.9→1.0 (200ms, ease-out-back, 5-10% overshoot)
2. Checkmark: stroke draw (150ms, ease-out, 100ms delay)
3. Color: to green (200ms); ambient glow/particles (300ms)
4. Total: 400-500ms

### Confirmation Badge
1. Badge scales from 0 (200ms, ease-out-back)
2. Text fades in (150ms, 50ms delay)
3. Background pulse (300ms, sine)

### Payment Success
1. Spinner → checkmark crossfade (200ms)
2. Checkmark draws (200ms); container → success color (200ms)
3. Text fades in (200ms, 100ms delay); optional confetti (300-500ms)

## Error State

### Error Shake
- Horizontal oscillation ±10-15px, 2-3 cycles decreasing amplitude
- ease-in-out, 300-400ms total; red tint; no overshoot; settles at origin

### Inline Validation
1. Error text slides down + fades in (200ms)
2. Border → red (150ms); icon scales in (150ms, 50ms delay)
3. Optional single shake (200ms)

### Form Submission Error
1. Button returns to normal (200ms)
2. Error message slides in (250ms)
3. Affected fields highlight red (150ms, staggered 30ms)
4. Smooth scroll to first error (300ms, ease-in-out)

## Loading States

### Spinner
- Continuous 360°, linear, 1000-1500ms/rev; optional breathing pulse (2-3s)

### Skeleton
- Gradient sweep L→R, 1500-2000ms; base 10-20% opacity, peak 30-40%

### Progress Bar
- Width/transform, ease-in-out; optional color milestones + shimmer

### Indeterminate
- Oscillating position/width, 1500-2500ms, ease-in-out; continuous, never frantic

## Warning State
1. Yellow/amber border (150ms)
2. Warning icon scales in (150ms, subtle overshoot)
3. Optional icon pulse (2-3s, sine); text fades in (200ms, 50ms delay)

## Disabled / Enabled

- **Disabling**: opacity to 50-60% (200ms); optional scale to 98%
- **Enabling**: opacity to 100% (200ms); optional scale pulse 98%→100%

## Focus States
- Focus ring: scale 95%→100% + opacity (150ms)
- Card focus: scale 1.01, shadow increase (150ms)
- Tab nav focus: <100ms; must work with reduced-motion
