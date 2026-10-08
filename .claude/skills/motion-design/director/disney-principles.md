# Disney's 12 Principles — UI Adapted

## 1. Squash and Stretch

- Squash: scale ~[1.2, 0.8]; Stretch: ~[0.85, 1.15]
- Impact: 2-4 frames (30-65ms); Recovery: 4-8 frames (65-130ms)
- Preserve volume: width +20% → height decreases proportionally
- Skip for premium/luxury brands

## 2. Anticipation

- Small motion opposite to main direction before action
- Duration: 100-200ms, magnitude: 10-20% of main action
- Button: scale down 3% before expanding; Card: shift 5-10px away first
- Skip for micro-feedback (<150ms)

## 3. Staging

- Dim non-hero elements to 40-60% opacity; optional 2-4px blur
- Hero enters 100-200ms after supporting elements
- One primary action per timing beat

## 4. Straight Ahead vs. Pose to Pose

| Approach | Feel | Best For |
|----------|------|----------|
| Straight Ahead | Fluid, spontaneous | Particles, ambient, generative art |
| Pose to Pose | Planned, controlled | UI transitions, state changes |

## 5. Follow Through and Overlapping Action

- Child delay: 50-150ms behind parent
- Trailing elements: offset stop times by 100-200ms
- Use spring easing for trailing parts (lower stiffness = more trailing)

## 6. Slow In and Slow Out

| Context | Easing | Why |
|---------|--------|-----|
| Entrance | ease-out | Arrives smoothly |
| Exit | ease-in | Departs quickly |
| On-screen | ease-in-out | Smooth journey |
| Ambient loop | sine ease-in-out | Seamless |

**NEVER** linear for spatial movement. Linear only for: rotation, progress bars, timers.

## 7. Arcs

- Add 10-20px perpendicular offset at path midpoint
- Subtle (5px) for corporate, pronounced (20px+) for playful
- Mechanical UIs can use straight paths intentionally

## 8. Secondary Action

- Amplitude: 30-50% of primary; timing: 50-100ms after primary
- Different easing than primary
- Examples: card enters → shadow grows; button presses → ripple expands

## 9. Timing

| Weight/Mood | Duration |
|-------------|----------|
| Heavy (modals, pages) | 400-800ms |
| Light (tooltips, toggles) | 100-250ms |
| Sad/serious | 600ms+ |
| Happy/light | 200-400ms |
| Urgent | 100-200ms |

Enter-exit asymmetry: entrances 30-50% longer than exits.

## 10. Exaggeration

| Personality | Exaggeration |
|-------------|-------------|
| Playful | 15-25% |
| Energetic | 20-30% |
| Corporate | 0-5% |
| Premium | 0% |

- Scale overshoot: 10-30% beyond target; rotation: ±5-15°

## 11. Solid Drawing

- Maintain consistent proportions across keyframes
- Use scale + rotation together for depth
- Shadow behavior matches implied light source

## 12. Appeal

- Smooth curves over sharp angles; satisfying timing
- Personality consistency across all elements
- Appeal killers: jerky motion, inconsistent timing, abrupt stops, uniform animation

## Combining Principles

| Recipe | Principles Used |
|--------|----------------|
| Button press | Anticipation + Squash/Stretch + Follow-Through + Secondary + Timing |
| Card entrance | Anticipation + Arcs + Slow In/Out + Follow-Through + Staging |
| Success celebration | Exaggeration + Secondary + Timing + Squash/Stretch + Appeal |
| Error shake | Timing + Slow In/Out + Staging (no exaggeration) |
| Loading spinner | Timing + Slow In/Out + Appeal |
