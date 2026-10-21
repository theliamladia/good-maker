---
name: good-seal
description: Put unreleased GOOD® pieces/looks on a page without exposing them — seal the images with GOOD_LOCK_KEY, serve them scrambled from /api/outfit and draw them to canvas. Use whenever a preview, locked or unreleased piece (renders, turntables, stills) appears on the site.
---

# Sealed previews

Owner's rules (verbatim, in force): "DO NOT make png available to download using inspect element
or any other method" · "lock it, make it viewable but not copiable" · "make sure the password can't
be grabbed thru inspect element … No hints or anything".

So: **unreleased pieces never ship as PNG/WebP files, never as `<img>`, never in git.**

## Seal
```bash
GOOD_LOCK_KEY="$(cat <scratchpad>/locked/GOOD_LOCK_KEY.txt)" \
  node tools/lock-seal.js qg-1 path/to/qg-1.png qg-spin-1 path/to/qg-1-spin.webp …
```
- Writes `api/_locked/<id>.enc` (AES-256-GCM). Commit only the `.enc` files.
- IDs: lowercase `a-z0-9-`, prefixed per drop (`wnd-`, `qg-`, `gud-`). Turntable sheets use
  `<prefix>-spin-<n>`; stills `<prefix>-<n>`.
- `api/outfit.js` already includes `api/_locked/**` (vercel.json). Gated drops (e.g. `gud-`) are
  refused by `api/outfit.js` until open — add a gate there if a drop needs one.
- Source images live in the scratchpad or `tools/studio/work/` (gitignored). Never `git add` them.

## Draw (client)
`GET /api/outfit?id=<id>` → `{ k, d }`: base64 key + base64 data XORed with it. Copy the
`scrambled()` helper from `js/q.js` (or `js/wandering.js`):
```js
const { k, d } = await (await fetch(`api/outfit?id=${id}`, { cache: 'no-store' })).json();
const kb = Uint8Array.from(atob(k), (c) => c.charCodeAt(0));
const bmp = await createImageBitmap(new Blob([Uint8Array.from(atob(d), (c, i) => c.charCodeAt(0) ^ kb[i % kb.length])]));
canvas.getContext('2d').drawImage(bmp, …);
```
- Retry on 5xx (cold starts), `cache: 'no-store'`, `contextmenu` prevented on the canvas,
  `user-select: none`.
- Turntables: one sheet of 24 frames (202×407 each) → draw frame `k` with `drawImage(sheet, k*FW, 0, FW, FH, …)`;
  show the still first, fetch the sheet when the canvas nears the viewport (IntersectionObserver),
  advance a frame every 260 ms, drag to turn. Each spinner tracks its own last-drawn frame (so
  reduced-motion still draws one).
- Lazy-load: only fetch when visible (MAKER® uses `whenSeen`).

## Verify
Locally: `curl -s "localhost:8798/api/outfit?id=<id>" | head -c 40` returns `{"k":…`. After
deploy, the same against good.leems.me. Check the page source and network tab hold no PNG.
