# Design DNA Schema

Three-dimensional design profile:
- **design_system** — measurable tokens
- **design_style** — qualitative perception
- **visual_effects** — special rendering such as Canvas, WebGL, 3D, particles, shaders, scroll effects, cursor effects, SVG animation, and glassmorphism

Every non-optional field below must appear in the final JSON output. Include optional fields only when their stated source data exists.

## Top-Level Structure

### `meta`
- `name`
- `description`
- `source_references`
- `created_at`

### `design_system`
The structural and measurable layer.

#### `design_system.color`
- `palette_type`
- `primary.hex`
- `primary.role`
- `secondary.hex`
- `secondary.role`
- `accent.hex`
- `accent.role`
- `neutral.scale`
- `neutral.usage`
- `semantic.success`
- `semantic.warning`
- `semantic.error`
- `semantic.info`
- `surface.background`
- `surface.card`
- `surface.elevated`
- `contrast_strategy`
- `measurement` *(optional)* — when the reference was measured with `scripts/measure-colors.mjs`, copy its measurement configuration (including `k`) so verification can reuse the same clustering settings
- `measured_palette` *(optional)* — when the reference was measured, copy its palette (`hex`, `coverage`, `role` per entry) for traceability; `coverage` is a `0..1` fraction

#### `design_system.typography`
- `type_scale.display.size`
- `type_scale.display.weight`
- `type_scale.display.line_height`
- `type_scale.display.tracking`
- `type_scale.heading_1.size`
- `type_scale.heading_1.weight`
- `type_scale.heading_1.line_height`
- `type_scale.heading_1.tracking`
- `type_scale.heading_2.size`
- `type_scale.heading_2.weight`
- `type_scale.heading_2.line_height`
- `type_scale.heading_2.tracking`
- `type_scale.heading_3.size`
- `type_scale.heading_3.weight`
- `type_scale.heading_3.line_height`
- `type_scale.heading_3.tracking`
- `type_scale.body.size`
- `type_scale.body.weight`
- `type_scale.body.line_height`
- `type_scale.body.tracking`
- `type_scale.body_small.size`
- `type_scale.body_small.weight`
- `type_scale.body_small.line_height`
- `type_scale.body_small.tracking`
- `type_scale.caption.size`
- `type_scale.caption.weight`
- `type_scale.caption.line_height`
- `type_scale.caption.tracking`
- `type_scale.overline.size`
- `type_scale.overline.weight`
- `type_scale.overline.line_height`
- `type_scale.overline.tracking`
- `font_families.heading`
- `font_families.body`
- `font_families.mono`
- `font_style_notes`

#### `design_system.spacing`
- `base_unit`
- `scale`
- `content_density`
- `section_rhythm`

#### `design_system.layout`
- `grid_system`
- `max_content_width`
- `columns`
- `gutter`
- `breakpoints`
- `alignment_tendency`

#### `design_system.shape`
- `border_radius.small`
- `border_radius.medium`
- `border_radius.large`
- `border_radius.pill`
- `border_usage`
- `divider_style`

#### `design_system.elevation`
- `shadow_style`
- `levels.low`
- `levels.medium`
- `levels.high`
- `depth_cues`

#### `design_system.iconography`
- `style`
- `stroke_weight`
- `size_scale`
- `preferred_set`

#### `design_system.motion`
- `easing`
- `duration_scale.micro`
- `duration_scale.normal`
- `duration_scale.macro`
- `entrance_pattern`
- `exit_pattern`
- `philosophy`

#### `design_system.components`
- `button_style`
- `input_style`
- `card_style`
- `navigation_pattern`
- `modal_style`
- `list_style`
- `component_notes`

### `design_style`
The qualitative and perceptual layer.

#### `design_style.aesthetic`
- `mood`
- `visual_metaphor`
- `era_influence`
- `genre`
- `personality_traits`
- `adjectives`

#### `design_style.visual_language`
- `complexity`
- `ornamentation`
- `whitespace_usage`
- `visual_weight_distribution`
- `focal_strategy`
- `contrast_level`
- `texture_usage`

#### `design_style.composition`
- `hierarchy_method`
- `balance_type`
- `flow_direction`
- `grouping_strategy`
- `negative_space_role`

#### `design_style.imagery`
- `photo_treatment`
- `illustration_style`
- `graphic_elements`
- `pattern_usage`
- `image_shape`

#### `design_style.interaction_feel`
- `feedback_style`
- `hover_behavior`
- `transition_personality`
- `loading_style`
- `microinteraction_density`

#### `design_style.brand_voice_in_ui`
- `tone`
- `formality`
- `cta_style`
- `empty_state_approach`
- `error_tone`

### `visual_effects`
The special rendering and advanced visual behavior layer.

#### `visual_effects.overview`
- `effect_intensity`
- `performance_tier`
- `fallback_strategy`
- `primary_technology`

#### `visual_effects.background_effects`
- `type`
- `description`
- `technology`
- `params.color_palette`
- `params.speed`
- `params.density`
- `params.opacity`
- `params.blend_mode`

#### `visual_effects.particle_systems`
- `enabled`
- `type`
- `description`
- `technology`
- `params.count`
- `params.shape`
- `params.size_range`
- `params.movement_pattern`
- `params.color_behavior`
- `params.interaction`
- `params.spawn_area`

#### `visual_effects.3d_elements`
- `enabled`
- `type`
- `description`
- `technology`
- `params.renderer`
- `params.lighting`
- `params.camera`
- `params.materials`
- `params.geometry`
- `params.post_processing`
- `params.interaction_model`

#### `visual_effects.shader_effects`
- `enabled`
- `type`
- `description`
- `technology`
- `params.uniforms`
- `params.vertex_manipulation`
- `params.fragment_output`
- `params.noise_type`
- `params.distortion`

#### `visual_effects.scroll_effects.parallax`
- `enabled`
- `layers`
- `depth_range`
- `speed_curve`

#### `visual_effects.scroll_effects.scroll_triggered_animations`
- `enabled`
- `trigger_points`
- `animation_type`
- `scrub_behavior`

#### `visual_effects.scroll_effects.scroll_morphing`
- `enabled`
- `description`

#### `visual_effects.text_effects`
- `type`
- `description`
- `technology`
- `params.split_strategy`
- `params.animation_per_unit`
- `params.stagger`
- `params.effect_style`

#### `visual_effects.cursor_effects`
- `enabled`
- `type`
- `description`
- `params.shape`
- `params.size`
- `params.blend_mode`
- `params.trail`
- `params.interaction_zone`

#### `visual_effects.image_effects`
- `type`
- `description`
- `technology`
- `params.filter_pipeline`
- `params.hover_transform`
- `params.reveal_animation`
- `params.distortion_type`

#### `visual_effects.glassmorphism_neumorphism`
- `enabled`
- `style`
- `params.blur_radius`
- `params.transparency`
- `params.border_treatment`
- `params.shadow_type`
- `params.light_source_angle`

#### `visual_effects.canvas_drawings`
- `enabled`
- `type`
- `description`
- `technology`
- `params.draw_method`
- `params.animation_loop`
- `params.color_scheme`
- `params.responsiveness`
- `params.interaction`

#### `visual_effects.svg_animations`
- `enabled`
- `type`
- `description`
- `params.animation_method`
- `params.path_morphing`
- `params.stroke_animation`
- `params.filter_effects`

#### `visual_effects.composite_notes`
- Free-text notes for layered effects, implementation ambiguity, performance trade-offs, or screenshot-only observations

## Field Guidance

### `design_system` (Dimension 1: Structural / Measurable)
Concrete, token-level values. Extract exact values where visible; estimate from visual inspection otherwise.

- **`color.palette_type`**: "monochromatic", "complementary", "analogous", "triadic", "split-complementary"
- **`color.contrast_strategy`**: How text/background contrast is managed — "high contrast", "subtle layers", "dark-on-light dominant"
- **`typography.font_style_notes`**: e.g. "geometric sans with humanist touches"
- **`spacing.content_density`**: "compact", "comfortable", "spacious"
- **`spacing.section_rhythm`**: How vertical spacing varies between sections
- **`layout.alignment_tendency`**: "strict grid", "centered", "asymmetric", "mixed"
- **`shape.border_usage`**: "none", "subtle 1px", "bold borders", "only on inputs"
- **`elevation.shadow_style`**: "none", "soft diffused", "hard drop", "layered"
- **`elevation.depth_cues`**: "shadows", "overlapping layers", "blur/glass", "color intensity"
- **`motion.philosophy`**: "minimal functional", "playful bouncy", "cinematic", "none"
- **`components`**: Describe observed patterns — e.g. "ghost buttons with thick borders, rounded inputs with inner shadow"

### `design_style` (Dimension 2: Qualitative / Perceptual)
Subjective assessments. Use descriptive language.

- **`aesthetic.mood`**: Array of 3–5 mood words, e.g. ["calm", "professional", "warm"]
- **`aesthetic.genre`**: e.g. "corporate SaaS", "indie creative", "luxury editorial", "neo-brutalist"
- **`aesthetic.personality_traits`**: As if the design were a person, e.g. ["confident", "approachable", "meticulous"]
- **`visual_language.complexity`**: "minimal", "moderate", "rich", "maximal"
- **`visual_language.ornamentation`**: "none", "subtle accents", "decorative", "heavily ornamented"
- **`visual_language.focal_strategy`**: "single hero element", "distributed interest", "progressive reveal"
- **`composition.hierarchy_method`**: "scale contrast", "color weight", "spatial isolation", "typographic hierarchy"
- **`composition.balance_type`**: "symmetric", "asymmetric", "radial", "mosaic"
- **`interaction_feel.transition_personality`**: "snappy", "smooth glide", "bouncy elastic", "fade-subtle"
- **`brand_voice_in_ui.cta_style`**: "direct imperative", "friendly invitation", "urgent scarcity", "subtle suggestion"

### `visual_effects` (Dimension 3: Special Rendering / Visual Wizardry)
Effects beyond standard CSS. These often require Canvas, WebGL, SVG animation, shader programs, or JS animation libraries. When not directly observable from static code, describe them from screenshots or video.

- **`overview.effect_intensity`**: "none", "subtle-accent", "moderate", "heavy-immersive"
- **`overview.performance_tier`**: "lightweight" (CSS + simple JS), "medium" (Canvas 2D, SVG anim), "heavy" (WebGL, Three.js, shaders)
- **`overview.fallback_strategy`**: What happens on low-end devices — "disable effects", "reduce to CSS", "static snapshot"
- **`overview.primary_technology`**: "CSS only", "Canvas 2D", "WebGL/Three.js", "GSAP", "Lottie", "SVG SMIL", "Pixi.js"
- **`background_effects.type`**: "gradient-animation", "noise-field", "mesh-gradient", "video-bg", "generative-art", "none"
- **`particle_systems.type`**: "floating-dots", "confetti", "snow", "fireflies", "connected-nodes", "custom"
- **`particle_systems.params.interaction`**: "mouse-repel", "mouse-attract", "click-burst", "none"
- **`3d_elements.type`**: "hero-model", "product-viewer", "scene-bg", "text-extrusion", "abstract-geometry"
- **`3d_elements.params.post_processing`**: e.g. ["bloom", "FXAA", "depth-of-field", "chromatic-aberration"]
- **`shader_effects.type`**: "noise-distortion", "wave", "morph", "color-shift", "custom-GLSL"
- **`shader_effects.params.noise_type`**: "perlin", "simplex", "worley", "fbm"
- **`scroll_effects.parallax.layers`**: Number of depth layers, e.g. "3"
- **`scroll_effects.scroll_triggered_animations.animation_type`**: "fade-up", "scale-in", "clip-reveal", "counter", "draw-SVG"
- **`text_effects.type`**: "split-letter-animate", "typewriter", "glitch", "gradient-fill", "3d-extrude", "none"
- **`text_effects.params.split_strategy`**: "by-char", "by-word", "by-line"
- **`cursor_effects.type`**: "custom-cursor", "magnetic-buttons", "spotlight", "trail", "none"
- **`image_effects.type`**: "hover-distortion", "reveal-clip", "parallax-tilt", "rgb-shift", "none"
- **`image_effects.params.distortion_type`**: "barrel", "wave", "liquid", "glitch"
- **`glassmorphism_neumorphism.style`**: "glass", "neumorphic-light", "neumorphic-dark", "frosted-layers", "none"
- **`canvas_drawings.type`**: "generative-lines", "interactive-blobs", "data-visualization", "pattern-fill", "none"
- **`svg_animations.type`**: "path-draw", "morph-shapes", "logo-reveal", "decorative-loop", "none"
- **`composite_notes`**: Free-text description of how multiple effects layer together, performance trade-offs, or effects visible only in screenshots that cannot be fully captured in structured fields
