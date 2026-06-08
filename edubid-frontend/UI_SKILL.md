---
name: make-interfaces-feel-better
description: Design engineering principles for making interfaces feel polished, with focus on micro-interactions, typography, and visual details.
---

Details that make interfaces feel better
Great interfaces rarely come from a single thing. It's usually a collection of small details that compound into a great experience. Apply these principles when building or reviewing UI code.

Core Principles

1. Concentric Border Radius
   Outer radius = inner radius + padding. Mismatched radii on nested elements is the most common thing that makes interfaces feel off.

2. Optical Over Geometric Alignment
   When geometric centering looks off, align optically. Buttons with icons, play triangles, and asymmetric icons all need manual adjustment.

3. Shadows Over Borders
   Layer multiple transparent box-shadow values for natural depth. Shadows adapt to any background; solid borders don't.

4. Interruptible Animations
   Use CSS transitions for interactive state changes — they can be interrupted mid-animation. Reserve keyframes for staged sequences that run once.

5. Split and Stagger Enter Animations
   Don't animate a single container. Break content into semantic chunks and stagger each with ~100ms delay.

6. Subtle Exit Animations
   Use a small fixed translateY instead of full height. Exits should be softer than enters.

7. Contextual Icon Animations
   Animate icons with opacity, scale, and blur instead of toggling visibility. Use exactly these values: scale from 0.25 to 1, opacity from 0 to 1, blur from 4px to 0px. If the project has motion or framer-motion in package.json, use transition: { type: "spring", duration: 0.3, bounce: 0 } — bounce must always be 0. If no motion library is installed, keep both icons in the DOM (one absolute-positioned) and cross-fade with CSS transitions using cubic-bezier(0.2, 0, 0, 1) — this gives both enter and exit animations without any dependency.

8. Font Smoothing
   Apply -webkit-font-smoothing: antialiased to the root layout on macOS for crisper text.

9. Tabular Numbers
   Use font-variant-numeric: tabular-nums for any dynamically updating numbers to prevent layout shift.

10. Text Wrapping
    Use text-wrap: balance on headings. Use text-wrap: pretty for body text to avoid orphans.

11. Image Outlines
    Add a subtle 1px outline with low opacity to images for consistent depth. The color must be pure black in light mode (rgba(0, 0, 0, 0.1)) and pure white in dark mode (rgba(255, 255, 255, 0.1)) — never a near-black like slate, zinc, or any tinted neutral. A tinted outline picks up the surface color underneath it and reads as dirt on the image edge.

12. Scale on Press
    A subtle scale(0.96) on click gives buttons tactile feedback. Always use 0.96. Never use a value smaller than 0.95 — anything below feels exaggerated. Add a static prop to disable it when motion would be distracting.

13. Skip Animation on Page Load
    Use initial={false} on AnimatePresence to prevent enter animations on first render. Verify it doesn't break intentional entrance animations.

14. Never Use transition: all
    Always specify exact properties: transition-property: scale, opacity. Tailwind's transition-transform covers transform, translate, scale, rotate.

15. Use will-change Sparingly
    Only for transform, opacity, filter — properties the GPU can composite. Never use will-change: all. Only add when you notice first-frame stutter.

16. Minimum Hit Area
    Interactive elements need at least 40×40px hit area. Extend with a pseudo-element if the visible element is smaller. Never let hit areas of two elements overlap.

Review Output Format
Always present changes as a markdown table with Before and After columns. Include every change you made — not just a subset. Never list findings as separate "Before:" / "After:" lines outside of a table. Group changes by principle using a heading above each table, and keep each row focused on a single diff so the reader can scan the whole list quickly.

Review Checklist

- Nested rounded elements use concentric border radius
- Icons are optically centered, not just geometrically
- Shadows used instead of borders where appropriate
- Enter animations are split and staggered
- Exit animations are subtle
- Dynamic numbers use tabular-nums
- Font smoothing is applied
- Headings use text-wrap: balance
- Images have subtle outlines
- Buttons use scale on press where appropriate
- AnimatePresence uses initial={false} for default-state elements
- No transition: all — only specific properties
- will-change only on transform/opacity/filter, never all
- Interactive elements have at least 40×40px hit area
