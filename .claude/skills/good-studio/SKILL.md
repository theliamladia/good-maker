---
name: good-studio
description: Design and render GOOD® Minecraft-skin garments — paint pieces as 64x64 skin textures, then render them alone (ghost), on grey mannequins, on players (incl. slim players like Leems), or as 24-frame turntables. Use for any new piece, collab concept, look, colourway revision, or "show me it on <player>/a mannequin".
---

# GOOD® studio

Tools live in `tools/studio/` (run `bash tools/studio/setup.sh <slug…>` once per session: it fetches
the skinview3d bundle and members' skins from their profiles into `models/`).
Work files go in `tools/studio/work/` (gitignored). Unreleased renders never get committed —
see **good-seal**.

## 1. Paint the piece (Python + Pillow)
```python
exec(open('/home/user/good-maker/tools/studio/lib.py').read())
ONYX, SILVER = C('#17171a'), C('#cfd2d6')
im = new(); tee(im, ONYX)                       # base torso under the jacket
coat(im, ONYX, fn=lambda s, u, v, w, h: sd(SILVER, s) if s == 'front' and u == 2 and v in (2, 4, 6, 8) else None)
flatten_top(im)                                 # jacket prints on layer 1, collar stays on layer 2
im.save('tools/studio/work/x/jacket.png')
```
- `paint(im, part, fn, layer)`: parts `torso` (front 8×12), `rarm`/`larm`, `rleg`/`lleg` (4×12).
  `fn(side, u, v, w, h)` → colour or None. Sides: front, back, left, right, top, bottom.
- `sd(colour, side, k, noise)` shades by face (front brightest, back darkest) with a little noise.
- `legs(fn)` builds trousers from scratch with boots; `lift_pants()` copies them to layer 2 (baggy).
- `neck(colour)` = a high collar on the head's outer layer (bottom rows, front corners only) —
  render it as the look's `accFile`.
- `ng(...)` = the new G (4×4); the SHIRT® G sits at `ox=2, oy=2` on the torso front.
- Textures are classic (4px arms). For slim players run `python3 tools/studio/toslim.py a.png`.
- Fabric tricks that worked: corduroy = alternate columns ×1.0/×0.84; pleats = dark column per
  face (×0.55); studs = grey checkerboard (#8f9197/#3a3b40); padded knees = alternating rows on
  v4–7; distressing = a few ASH™ pixels + noise; hardware = 1–2px silver/gold.

## 2. Render
Write a set to `tools/studio/work/<set>.json`, then:
```bash
NODE_PATH=$(npm root -g) node tools/studio/render.js ghost <set>   # garment alone, front view
NODE_PATH=$(npm root -g) node tools/studio/render.js shoot <set>   # on a player / mannequin
NODE_PATH=$(npm root -g) node tools/studio/render.js spin  <set>   # 24 turntable frames
NODE_PATH=$(npm root -g) node tools/studio/render.js raw   <set>   # player + raw texture (home skins)
```
Ghost entry: `{ "id": "f0", "f": "work/x/jacket.png", "kind": "top" | "bottom" | "topback" }`.
Shoot/spin entry:
```json
{ "id": "look1", "skin": "Chinny", "topFile": "work/x/jacket.png", "pantsFile": "work/x/pants.png",
  "accFile": "work/x/jacket-neck.png", "untucked": true,
  "pose": { "turn": 0, "ra": [0,0,5], "la": [0,0,-5], "rl": [0,0,0], "ll": [0,0,0] } }
```
- Grey mannequin = `"skin": "mannequin-grey"` (white/slim variants exist). For "each item": tops
  with no pants, pants with no top (`empty.png` is the default).
- Keep legs straight (`rl`/`ll` = 0): any leg rotation reads as a faint cross.
- Front view by default (owner prefers it over a quarter turn).
- Output: `tools/studio/work/out/<set>/<id>.png` (transparent). Look at every render with Read.
- Turntable sheets: `python3 tools/studio/spinsheet.py work/out/<set> work/out/<set>-sheets id1 id2 …`
  → `<id>-spin.webp` (24×202×407) + `<id>.png` still → seal them.

## 3. Show it
Lay renders out with **good-sheets** (concept sheet, look sheet, mannequin sheet). Send PNGs with
SendUserFile; iterate on feedback quickly (re-run the Python, re-render, re-sheet).

## Naming
Pieces: NAME® (FENCING JACKET®). Colourways ALL CAPS with ™ per colour (ONYX™/SILVER™); UNIQUE uses ⓤ.
Write GOOD® always; the site is MAKER®. New collab colours get ™ names + hexes in one palette table.
