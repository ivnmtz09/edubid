---
name: "EduBid"
colors:
  primary: "#ea580c"
  secondary: "#3b82f6"
  tertiary: "#3b82f6"
  neutral: "#FFFFFF"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
  surface: "#FFFFFF"
  text: "#111827"
typography:
  h1:
    fontFamily: "Inter"
    fontSize: 3rem
  body-md:
    fontFamily: "Inter"
    fontSize: 1rem
  label-caps:
    fontFamily: "JetBrains Mono"
    fontSize: 0.75rem
  sourceScale: "12/14/16/20/24/32"
  weights: "100, 200, 300, 400, 500, 600, 700, 800, 900"
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 4px
  md: 8px
  sourceScale: "4/8/12/16/24/32"
---

## Overview
Plataforma educativa con economia de aula basada en EduCoins y subastas pedagogicas institucionales.

## Style Foundations
- **Visual style:** modern, clean, high-contrast, gamified, academic, institutional-palette, bento-grid, kawaii-assistant
- **Typography scale:** 12/14/16/20/24/32 | Fonts: primary=Inter, display=Inter, mono=JetBrains Mono | weights=100, 200, 300, 400, 500, 600, 700, 800, 900
- **Color palette:** primary, neutral, success, warning, danger | Tokens: primary=#ea580c, secondary=#3b82f6, success=#16A34A, warning=#D97706, danger=#DC2626, surface=#FFFFFF, text=#111827
- **Spacing scale:** 4/8/12/16/24/32

## Accessibility
WCAG 2.2 AA, keyboard-first interactions, visible focus states

## Writing Tone
concise, confident, helpful

## Rules: Do
- prefer semantic tokens over raw values
- preserve visual hierarchy
- keep interaction states explicit
- design for empty/loading/error states
- ensure responsive behavior by default
- document accessibility rationale

## Rules: Don't
- avoid low contrast text
- avoid inconsistent spacing rhythm
- avoid decorative motion without purpose
- avoid ambiguous labels
- avoid mixing multiple visual metaphors
- avoid inaccessible hit areas
