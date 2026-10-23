---
name: good-sheets
description: Make GOOD® visual sheets as PNGs — concept sheets, look sheets (models on white), grey-mannequin "every piece" sheets, press illustrations, infographics and the drop calendar/timeline — in the house art direction, rendered from HTML. Use for any "make a sheet / press image / infographic / update the calendar" request.
---

# GOOD® sheets (HTML → PNG)

Render any page with real fonts:
```bash
NODE_PATH=$(npm root -g) node tools/studio/sheet.js page.html out.png [width=1600] [scale=1] [--clip=WxH]
```
Write sheet HTML in the scratchpad (or `tools/studio/work/`), images next to it, then Read the PNG
and check it against the rules below before sending it (SendUserFile, display: render).
Images taller than 8000px get scaled in chat — offer the original in a .zip if needed.

## House art direction (from CLAUDE.md — the owner enforces it)
- COLLABORATIONS® look: GOOD® BLUE `#0000ff` ground, white type. Inter 500–600 headlines with
  slight negative tracking (never 700–900), Inter 300–400 copy at 1.55+ line height, Space Mono
  labels ≈11px, letter-spacing .22em. Thin 1px white rules between sections.
- Pieces sit in a **spotlight**: `radial-gradient(closest-side, rgba(255,255,255,.55), rgba(255,255,255,.12) 60%, transparent)`.
  No cards, no panels, no liquid glass. Front view; tops zoomed on the garment, trousers alone.
- Under each piece: one dot per colour, then the colourway name (ONYX™/SILVER™).
- THE COLOR STORY®: a strip of vertical bars, no names.
- Copy: max three sentences, WANDERING® voice (scene first, then what you wear).
- Negative space first (30–40% empty, 8–10% side margins), 3–4 items per row max, one headline.
- Owner disliked: crowded/bold/full-bleed sheets, the STUDY® serif style on GOOD® messaging,
  liquid glass, quarter turns, descriptions on look sheets when asked to remove them.

## Templates (copy the structure)
- **Concept sheet**: tag (`GOOD® COLLABORATION · CONCEPT`), h1, ≤3-sentence lede, COLOR STORY®
  bars, then one section per piece: header row (name ⟷ short detail line), 3-column row of
  spotlight figures (2-column centred when 2), dots + colourway. Ghost renders at ~320px.
- **Look sheet** (owner asked for white BG): `background:#fff; color:#111114`, models 340px wide,
  soft drop shadow `drop-shadow(0 26px 22px rgba(0,0,0,.12))`, caption = LOOK n · pieces · dots +
  colourways. Footer `CONCEPT · NOT FOR RELEASE`.
- **Every piece on grey mannequins**: same as look sheet, one section per piece, 3 per row.
- **Press illustration / infographic**: 1200px wide, sections split by 1px rules, numbered tags
  (01, 02…), phones/product shots in a spotlight, ≤3 short steps per feature.
- **Timeline / drop calendar**: `tools/studio/press/timeline/timeline.html` (1900×500, logos,
  dates, OUT NOW / NEXT WEEK / TBD / COMING SOON). Edit the items, then
  `node tools/studio/sheet.js tools/studio/press/timeline/timeline.html good-timeline.png 1900 2 --clip=1900x500`.
  Drops land on Fridays. Order so far: GOOD® CRATE Nº001 (Oct 9) · INMOTION® CRATE Nº002 (Oct 15) ·
  GUD™ (Oct 19) · WANDERING® (Fri Oct 30) · GOOD® CRATE Nº003 (Fri Nov 6) · Q&G® (Fri Nov 13) ·
  GOOD® CRATE Nº004 (Fri Nov 20) · break: "WE NEED A BREAK!" (Fri Nov 27, Thanksgiving) · UBIQUITY® (Fri Dec 4).

Collab sheets may follow the collab's own world when the owner asks (e.g. white BG look sheets);
keep the GOOD® naming either way.
