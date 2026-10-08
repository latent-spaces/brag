# Timing & Easing Tables

## Duration by Element Type

| Element | Duration |
|---------|----------|
| Tooltip / micro-feedback | 80-120ms |
| Button / toggle | 120-180ms |
| Icon transition | 150-250ms |
| Card enter/exit | 200-350ms |
| Modal / dialog | 300-400ms |
| Page transition | 400-600ms |
| Dramatic reveal | 600-1200ms |
| Ambient | 2000-20000ms |

## Distance-Duration Scaling

50px=0.8x | 100px=1.0x | 200px=1.3x | 300px=1.5x | 400px=1.6x | Full screen=1.8-2.0x

## Enter vs. Exit
Entrance = base (100%). Exit = 65-75% of entrance.

## Interactive Feedback

| Interaction | Max Latency |
|------------|-------------|
| Hover | <100ms |
| Press/tap | <150ms |
| Release/settle | 200-300ms |
| Error shake | 300-400ms |
| Long press | 500-800ms |
| Drag start | <50ms |

## Duration by Personality

| Personality | Quick | Standard | Slow |
|------------|-------|----------|------|
| Playful | 150ms | 250ms | 400ms |
| Premium | 350ms | 500ms | 800ms |
| Corporate | 200ms | 300ms | 450ms |
| Energetic | 100ms | 180ms | 300ms |

## Easing: Directional Rules

Entrance=ease-out | Exit=ease-in | On-screen=ease-in-out | Looping=sine | Rotation/progress=linear

## Easing: Industry Standards

| Name | Cubic Bezier | Use |
|------|-------------|-----|
| MD3 Standard | (0.2, 0, 0, 1) | Default on-screen |
| MD3 Emphasized | (0.05, 0.7, 0.1, 1) | Entrances |
| MD3 Accelerate | (0.3, 0, 1, 1) | Exits |
| MD3 Decelerate | (0, 0, 0, 1) | Entering |
| Apple HIG | (0.25, 0.1, 0.25, 1) | iOS default |
| Apple Spring | stiffness:300 damping:20 | Interactive |
| Snappy UI | (0.2, 0, 0, 1) | Fast, decisive |
| Gentle float | (0.4, 0, 0.2, 1) | Ambient |
| Bounce settle | (0.175, 0.885, 0.32, 1.275) | Playful |
| Elastic snap | (0.68, -0.55, 0.265, 1.55) | Dramatic |

## Material-Based Easing

| Material | Duration Scale | Overshoot |
|----------|---------------|-----------|
| Rigid (metal) | 1.2x | 0% |
| Elastic (rubber) | 0.8x | 15-25% |
| Fluid (water) | 1.5x | 5% |
| Paper (cards) | 1.0x | 3-5% |
| Gas (smoke) | 2.0x | 0% |
| Glass | 0.9x | 0% |

## Spring Parameters

| Feel | Stiffness | Damping |
|------|-----------|---------|
| Very stiff | 400+ | 25-30 |
| Standard | 250-350 | 18-24 |
| Bouncy | 150-250 | 10-15 |
| Very bouncy | 100-200 | 5-10 |
| Gentle | 100-150 | 20-25 |

Damping: <1.0=oscillates, 1.0=fastest no-oscillation, >1.0=slow settle.

## Stagger Patterns

| Pattern | Delay | Budget |
|---------|------|--------|
| Micro cascade | 20-40ms | <200ms |
| Standard | 50-100ms | <400ms |
| Dramatic | 100-200ms | <600ms |
| Wave | 30-60ms | <500ms |

Direction: top-to-bottom (lists) | L-to-R (horizontal) | center-out (hero) | random (organic) | reverse (exits)

Total stagger MUST stay <500ms.

## Overshoot Budget

| Context | Overshoot |
|---------|-----------|
| Success | 5-10% |
| Error | 0% |
| Feedback | 2-5% |
| Celebration | 15-25% |
| Premium | 0% |
