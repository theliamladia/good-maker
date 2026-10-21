---
name: good-collab-page
description: Build a GOOD® collaboration landing page (like /wandering for WANDERING® or /q for Q&G®) — unlisted, its own world (intro sequence, CRT, custom type) but GOOD® naming, sealed spinning looks, colour story and piece list. Use when the owner asks for a landing/launch page for a collab or drop.
---

# Collab landing page

Reference implementations: `wandering.html` + `wandering.css` + `js/wandering.js` (pixel valley,
sunrise on scroll, CRT) and `q.html` + `q.css` + `js/q.js` (Q&G®: fake break-in boot, full-height
title cards, brutalist Evangelion-core, near-bitmap type, heavy CRT). Copy the closest one.

## Contract (every collab page keeps these)
- URL = `/<slug>` → `<slug>.html` (cleanUrls). Unlisted until the owner says ship:
  `<meta name="robots" content="noindex">`, not in the nav, not on RELEASES® / MAKER®.
- Full meta block: title `NAME® · PARTNER + GOOD®`, description, canonical, og:*, twitter:*,
  theme-color, favicon (copy from wandering.html).
- A way home: fixed `← GOOD®` link top-left. A footer with © 2026 GOOD®.
- Naming: GOOD® always; pieces NAME®; colourways ALL CAPS with ™; the copy line the owner gives
  is used verbatim.
- Unreleased looks are **sealed** turntables drawn to canvas (skill **good-seal**): still first,
  24-frame sheet when near the viewport, always slowly spinning (260ms/frame), drag to turn.
- Sections: hero → THE COLOR STORY® (vertical bars, no names) → THE LOOKS → THE PIECES.
- `prefers-reduced-motion`: skip intros, stop CRT animation, still draw one frame per look.
- Phone: no horizontal scroll at 390px (tables collapse to rows; grids to 1–2 columns).

## Intro sequences (pattern from js/q.js)
- Boot/loader on a fixed black layer with SKIP + Esc/Enter/Space, ~4s total.
- Full-screen title cards on a `<canvas>`: measure the word with `measureText`
  (`actualBoundingBoxAscent + Descent`) and scale so the ink fills the viewport height exactly,
  compress horizontally to fit (`sx = min(1, 0.96·W / inkWidth)`); flash white 60ms between cards.
- Wait for fonts first: `document.fonts.load('900 100px "Font"', 'TEXT')` (with a timeout).

## CRT recipe (owner wants it HEAVY)
Fixed overlays above everything, `pointer-events:none`: scanlines (2px dark every 4px) + RGB
mask stripes + flicker (`steps(2)` 0.09s) + a rolling bright band; SVG fractal-noise grain
(screen blend, animated position); vignette + inset shadow + rounded corners; body text-shadow
RGB fringing (`2px 0 rgba(255,0,40,.55), -2px 0 rgba(0,200,255,.5)`); occasional jitter keyframe.
"Degraded / almost bitmap" type: SVG mosaic filters (`feFlood`+`feTile`+`feComposite`+
`feMorphology dilate`, then `feFuncA type=discrete`) on display type, an alpha-threshold filter
on small text, title-card canvases drawn at 1/5 resolution, binarised, shown `image-rendering: pixelated`.

## Ship
QA with **good-dev-check** (`node tools/dev/check.js /<slug> http://localhost:8798 --signed-out --wait=9000`),
then **good-ship**. After it's live, update the drop calendar (**good-sheets**) if the owner asks.
