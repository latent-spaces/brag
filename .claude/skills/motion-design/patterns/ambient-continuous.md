# Ambient & Continuous Patterns

Ambient amplitude: 10-20% of primary motion. Never compete for attention.

## Breathing / Pulse

- Scale oscillation 0.98-1.02, sine ease-in-out, 2000-4000ms/cycle
- Alt: opacity oscillation 0.7-1.0

| Context | Scale Range | Duration | Opacity Range |
|---------|-----------|----------|--------------|
| Active indicator | 0.95-1.05 | 2000ms | 0.6-1.0 |
| Waiting/idle | 0.98-1.02 | 3000ms | 0.8-1.0 |
| Background element | 0.99-1.01 | 4000ms | 0.9-1.0 |
| CTA attention | 0.97-1.03 | 2500ms | 0.7-1.0 |

Pulsing >±5% scale becomes attention-demanding.

## Floating / Hovering

- Y position ±5-15px, sine ease-in-out, 3000-5000ms/cycle
- Optional: slight rotation ±2-3°, offset 30% of position cycle

**Layered floating** (multiple elements — different durations prevent sync):
- Element 1: 4000ms, ±10px
- Element 2: 5500ms, ±8px (offset 30%)
- Element 3: 3500ms, ±12px (offset 60%)

## Gradient Shift

- Background-position or gradient angle shift
- Duration: 8000-20000ms/cycle; range: ±10-20% position or ±15° angle
- Easing: linear or sine; should be imperceptible at a glance

## Parallax

| Layer | Speed Ratio | Content |
|-------|------------|---------|
| Foreground | 1.0x | Interactive, text |
| Midground | 0.5x | Decorative, cards |
| Background | 0.2x | Patterns, scenery |
| Deep background | 0.1x | Texture, atmospheric |

**Scroll-driven**: total displacement <100px; avoid on mobile; never parallax text
**Mouse-driven**: foreground 10-20px max, background 5-10px opposite direction, 100-200ms interpolation

## Continuous Rotation

- Spinners: linear easing, 1000-2000ms/revolution

| Variant | Speed | Use Case |
|---------|-------|----------|
| Slow spin | 10-30s/rev | Background decoration |
| Gear-like | 3-5s/rev | Technical/mechanical |
| Orbital | 5-15s/rev | Space/science theme |
| Wobble | 2-4s/cycle, sine | Playful idle |

## Shimmer / Gleam

- Gradient sweep left-to-right, 1500-2500ms/sweep
- Pause 2000-5000ms between sweeps
- Opacity gradient: 0%→30%→0%
- Use for: skeleton loading, premium accents, "new" badges

## Particle Ambient

### Snow/Falling: 10-20 elements, 20-60px/s down, ±10-20px drift, 3-8px, 30-70% opacity
### Dust/Motes: 5-10 elements, 10-30px/s mixed, 2-5px, 20-50% opacity
### Sparkle/Stars: 8-15 elements, opacity pulse 0→100%→0, 500-1500ms/sparkle, random stagger

**Performance**: <20 ambient elements, transform+opacity only, larger/fewer over small/numerous

## Combining Ambient Layers

| Layer | Type | Example |
|-------|------|---------|
| Background | Gradient shift or parallax | Slow color temperature change |
| Midground | Floating or particles | Gentle floating elements |
| Foreground | Breathing or shimmer | Subtle pulse on content |

Total ambient: max 20% of primary motion's visual energy.
