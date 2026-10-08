# Generation Guide

How to use a completed Design DNA JSON to generate designs in Phase 3. Covers all three dimensions.

## Priority Order

When generating a design from DNA JSON + content:

1. **Color & Typography** — define 80% of visual identity
2. **Spacing & Layout** — structural rhythm
3. **Shape & Elevation** — surface treatment
4. **Design Style qualitative fields** — mood, personality, composition approach
5. **Visual Effects** — special rendering layer (Canvas, WebGL, shaders, etc.)
6. **Motion & Interaction** — enhance after static layout and effects are solid

## Dimension 1: design_system → Code

### Tailwind CSS / Utility-First
```
color.primary.hex        → --color-primary / bg-[hex]
typography.font_families → font-family config
spacing.scale            → spacing config values
shape.border_radius      → rounded-{sm|md|lg|full}
elevation.levels         → shadow-{sm|md|lg}
```

### Plain CSS / CSS Variables
Generate a `:root` block with all design tokens:
```css
:root {
  --color-primary: {color.primary.hex};
  --color-secondary: {color.secondary.hex};
  --color-accent: {color.accent.hex};
  --font-heading: {typography.font_families.heading};
  --font-body: {typography.font_families.body};
  --radius-sm: {shape.border_radius.small};
  --radius-md: {shape.border_radius.medium};
  --radius-lg: {shape.border_radius.large};
  --shadow-low: {elevation.levels.low};
  --shadow-med: {elevation.levels.medium};
  --shadow-high: {elevation.levels.high};
  --ease: {motion.easing};
  --duration-micro: {motion.duration_scale.micro};
  --duration-normal: {motion.duration_scale.normal};
  --duration-macro: {motion.duration_scale.macro};
  /* ... map all tokens */
}
```

### Component Decisions
- `components.button_style` → button classes and variants
- `components.card_style` → card container treatment
- `components.navigation_pattern` → nav component choice
- `interaction_feel.hover_behavior` → :hover / :focus states
- `motion.easing` + `motion.duration_scale` → transition properties

## Dimension 2: design_style → Subjective Decisions

| DNA Field | Guides |
|---|---|
| aesthetic.mood | Overall emotional feeling — warm tones, cool precision, etc. |
| visual_language.whitespace_usage | padding/margin generosity |
| visual_language.contrast_level | How much elements pop vs. blend |
| composition.hierarchy_method | What tool to use for emphasis |
| composition.balance_type | Symmetric layout vs. dynamic asymmetry |
| imagery.graphic_elements | Decorative SVGs, gradients, patterns |
| brand_voice_in_ui.tone | Microcopy phrasing |
| interaction_feel.microinteraction_density | How many hover/click effects |

## Dimension 3: visual_effects → Special Rendering

### Technology Selection by Performance Tier

| Tier | Technologies | When to Use |
|---|---|---|
| **lightweight** | CSS animations, SVG SMIL, vanilla JS | `overview.performance_tier` = "lightweight" |
| **medium** | Canvas 2D, GSAP, Lottie, anime.js | `overview.performance_tier` = "medium" |
| **heavy** | Three.js, custom GLSL, Pixi.js, WebGL | `overview.performance_tier` = "heavy" |

### Implementation Patterns

#### Background Effects
```
"none"              → skip
"gradient-animation" → CSS @keyframes on linear-gradient or conic-gradient
"noise-field"       → Canvas 2D with Perlin/simplex noise
"mesh-gradient"     → SVG <mesh> or canvas interpolation
"video-bg"          → <video autoplay muted loop> with poster fallback
"generative-art"    → Canvas 2D or WebGL generative algorithms
```

#### Particle Systems
When `particle_systems.enabled: true`:
- For `count` < 100 and no complex physics → vanilla JS + Canvas 2D
- For `count` >= 100 or complex interaction → consider Pixi.js or Three.js Points
- Map `interaction` ("mouse-repel", "mouse-attract") to pointer event handlers
- Use `requestAnimationFrame` loop; include destroy/cleanup on unmount

#### 3D Elements
When `3d_elements.enabled: true`:
- Default to Three.js unless DNA specifies otherwise
- Apply `lighting`, `camera`, `materials` from params
- Add `post_processing` effects via EffectComposer
- Handle resize with `ResizeObserver`
- Load via CDN: `https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js`

#### Shader Effects
When `shader_effects.enabled: true`:
- Create vertex/fragment shaders based on `type`
- Pass `uniforms` from params (time, resolution, mouse position)
- For "noise-distortion": use noise functions matching `noise_type`
- Animate via `requestAnimationFrame` updating `u_time` uniform

#### Scroll Effects
- **Parallax**: Use `transform: translateY()` with scroll offset × layer speed
- **Scroll-triggered**: Use `IntersectionObserver` with `threshold` array
- **Scrub behavior**: If "scrubbed", animation progress = scroll progress. If "triggered", play once on enter.

#### Text Effects
```
"split-letter-animate" → Split text into <span> per char/word, stagger CSS animation
"typewriter"           → CSS steps() or JS interval revealing chars
"glitch"               → Layered clip-path + color offset animation
"gradient-fill"        → background-clip: text with animated gradient
"3d-extrude"           → text-shadow stack or WebGL text geometry
```

#### Cursor Effects
When `cursor_effects.enabled: true`:
- Hide default cursor: `cursor: none`
- Create custom cursor element following `pointermove`
- "magnetic-buttons": Apply transform pull on hover proximity
- "spotlight": Radial gradient mask following cursor
- "trail": Spawn fading elements on move

#### Glassmorphism / Neumorphism
```
"glass"             → backdrop-filter: blur({blur_radius}); background: rgba(..., {transparency})
"neumorphic-light"  → Dual box-shadow (light + dark offset) on light bg
"neumorphic-dark"   → Dual box-shadow (inverted) on dark bg
"frosted-layers"    → Stacked blur layers with varying opacity
```

#### Canvas Drawings
When `canvas_drawings.enabled: true`:
- Initialize canvas with `width/height` matching container
- Use `draw_method` to select rendering approach
- Animate with `requestAnimationFrame`
- Handle `responsiveness` via ResizeObserver

#### SVG Animations
When `svg_animations.enabled: true`:
- "path-draw": Animate `stroke-dashoffset` from path length to 0
- "morph-shapes": Interpolate `d` attribute between two paths
- "stroke-animation": Animate stroke properties (dasharray, width, color)

### Fallback Strategy

Always implement the fallback defined in `overview.fallback_strategy`:

```js
// Example: reduce to CSS on low-end devices
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowEnd = navigator.hardwareConcurrency <= 2;
if (prefersReduced || isLowEnd) {
  // Apply fallback: static CSS version, disable canvas/WebGL
}
```

## Output Format

Generate output as a single self-contained HTML file with inline CSS and JS (unless user specifies a framework). Include:

1. CSS custom properties block from `design_system` tokens
2. Component styles from `design_system.components` + `design_style`
3. Layout structure per `design_system.layout`
4. Content populated from user-provided content
5. Visual effects implemented per `visual_effects` specification
6. Animations/transitions if `design_system.motion.philosophy` is not "none"
7. Fallback handling for effects

For heavy effects requiring external libraries, load via CDN `<script>` tags:
```html
<!-- Three.js -->
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js"}}</script>

<!-- GSAP -->
<script src="https://cdn.jsdelivr.net/npm/gsap@latest/dist/gsap.min.js"></script>

<!-- Lottie -->
<script src="https://cdn.jsdelivr.net/npm/lottie-web@latest/build/player/lottie.min.js"></script>
```

## Quality Checks

Before delivering, verify:
- [ ] Every color in output traces back to DNA palette
- [ ] Font families match DNA specification
- [ ] Spacing rhythm matches DNA scale
- [ ] Border radius matches DNA shape tokens
- [ ] Overall mood matches `design_style.aesthetic.mood`
- [ ] Component patterns match DNA `components` descriptions
- [ ] Contrast ratios meet WCAG AA minimum (4.5:1 body text, 3:1 large text)
- [ ] Visual effects match `visual_effects` specification (type, technology, params)
- [ ] Fallback strategy is implemented for effects
- [ ] `prefers-reduced-motion` is respected
- [ ] No effects render when their `enabled` flag is `false`
- [ ] Canvas/WebGL contexts are properly sized and handle resize
- [ ] Animation loops use `requestAnimationFrame` (no `setInterval`)
