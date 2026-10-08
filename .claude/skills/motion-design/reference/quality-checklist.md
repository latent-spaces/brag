# Quality Checklist

## Visual Quality
- [ ] Elements >40px for motion, >100px for detail
- [ ] Readable at full speed without slow-motion
- [ ] Clear primary, secondary, ambient layers
- [ ] Counter-motion for balance where needed
- [ ] Natural arcs (unless intentionally mechanical)
- [ ] 1/3 rule (distance): no unbroken motion >1/3 container
- [ ] 1/3 rule (density): max 1/3 elements active simultaneously

## Technical Quality
- [ ] No linear easing on spatial movement
- [ ] Duration matches element type table
- [ ] Ease-out entrances, ease-in exits
- [ ] Duration proportional to distance
- [ ] Entrance duration >= exit duration
- [ ] Not opacity-only for important state changes
- [ ] Stagger total <500ms
- [ ] Follow-through: child elements offset 50-150ms

## Emotional Quality
- [ ] Target emotion identified before properties
- [ ] Personality archetype matches brand
- [ ] Setup → action → resolution structure
- [ ] Intensity matches interaction importance
- [ ] Consistent: same interaction = same motion
- [ ] Appropriate on 100th viewing

## Performance Quality
- [ ] Primary motion uses transform + opacity
- [ ] <20 animated elements per viewport
- [ ] No layout-triggering properties animated
- [ ] Elements staggered, not simultaneous
- [ ] Maintains 60fps (30fps acceptable for ambient)

## Accessibility Quality
- [ ] prefers-reduced-motion alternative provided
- [ ] No vestibular triggers without alternative
- [ ] Same interaction = same animation
- [ ] Critical info not motion-only
- [ ] Animations >5s are pausable

## Severity Tiers

### CRITICAL
- Linear easing on spatial movement
- Opacity-only for important states
- Exceeds 1/3 screen rule
- Missing primary layer
- Stagger >500ms
- Layout property animation causing jank

### HIGH
- Missing secondary layer
- Duration mismatch with element type
- Wrong directional easing
- Inconsistent personality
- No follow-through
- Missing reduced-motion alternative

### MEDIUM
- Missing ambient layer
- No anticipation phase
- Overshoot mismatch
- Could use better arcs
- Missing counter-motion
