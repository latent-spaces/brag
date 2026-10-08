# Decision Framework

## The First Questions

### 1. Purpose?

| Purpose | Approach | Priority |
|---------|----------|----------|
| Draw attention | Scale, color, pulse | Responsiveness |
| Guide sequence | Stagger, directional flow | Clarity |
| Provide feedback | Immediate response | Speed |
| Create atmosphere | Subtle, continuous | Subtlety |
| Explain relationship | Position, connection | Legibility |
| Celebrate/reward | Overshoot, particles | Delight |

### 2. Audience?
- Stressed → calm motion; Browsing → richer motion
- Task-focused → fast, minimal; Exploring → can be dramatic
- Seen 100x/day → fast, subtle; Seen once → can be dramatic

### 3. Context?
- Busy layout → simpler motion; Empty → can be dramatic
- Other animations active → coordinate or stagger
- Small container → small motion

## 4-Level Decision Hierarchy

### Level 1: Motion Category

| Category | When |
|----------|------|
| Revealing | Content appearing |
| Concealing | Content disappearing |
| Transitioning | Between states/views |
| Emphasizing | Drawing attention |
| Responding | Reacting to interaction |
| Ambient | Background atmosphere |

### Level 2: Motion Personality
Match to brand. See [motion-personality.md](motion-personality.md).

### Level 3: Motion Direction

| Direction | Communicates |
|-----------|-------------|
| Upward | Growth, aspiration |
| Downward | Settling, completion |
| Leftward | Regression, departure |
| Rightward | Progression, arrival |
| Outward (scale up) | Importance, emergence |
| Inward (scale down) | Dismissal, removal |
| Center-seeking | Focus, convergence |
| Center-fleeing | Distribution, release |

### Level 4: Implementation Properties
Choose animated properties. See [property-selection.md](../reference/property-selection.md).

## Decision Quick-Path

```
1. PURPOSE → What does this motion DO?
   ├── Feedback → short, ease-out, minimal
   ├── Entrance → ease-out, personality-matched
   ├── Exit → ease-in, 70% of entrance
   ├── Emphasis → scale or color pulse
   └── Ambient → slow, continuous, sine

2. PERSONALITY → Match keywords
   ├── Fun/bouncy → Playful
   ├── Elegant/luxury → Premium
   ├── Clean/professional → Corporate
   └── Bold/dynamic → Energetic

3. PROPERTIES → Minimum needed (two = sweet spot)

4. TIMING → Check duration table, adjust for distance/weight

5. EASING → Entering=ease-out, Leaving=ease-in, On-screen=ease-in-out, Looping=sine
```

## Evaluation Before Delivery

| Check | Question |
|-------|----------|
| Purpose | Clear function? |
| Personality | Matches brand/context? |
| Repetition | Fine on 100th viewing? |
| Attention | Respects viewer's focus? |
| Hierarchy | Reinforces importance? |
| Layers | Primary + secondary + ambient? |
| Timing | Duration appropriate? |
