# GOOD® DESIGN

Static site that dresses a Minecraft skin in a preset outfit.

- Keeps the user's **head + hat layer** from their uploaded skin.
- Fills arms, legs and torso with a **skin tone** (auto-detected from the face, picked with the colour picker, or clicked on the face preview).
- Shades that tone per face (lit from above/front, darker inner sides/back/bottom, cast shadows under sleeves and hems, hue-shifted shadows). The same rules apply to any chosen colour.
- Keeps **long hair** that hangs onto the torso (on by default for Slim bodies; Off / Short / Mid / Long control), with a 1-pixel eraser map to brush unwanted hair pixels back to the outfit. Hair is found by flooding down from the neckline through hair-coloured pixels, skipping colours that are the old outfit.
- **Headwear**: Keep / No hood / None. "No hood" drops hat-layer pixels matching the old outfit's main colours (hoods), keeping hair, hats and accessories.
- **Hair & Head cards**: swipeable cards (or tabs) in the same spot. Each has its control, a pixel map eraser (TORSO for hair, HEAD for hoods/hats) and its own undo/reset.
- **?** buttons on Hair and Headwear open short animated how-tos (`js/help.js`).
- Draws the **outfit** pixels on top, then shows a live 3D preview and a GOOD ME® download button.

## Username lookup

`api/skin.js` is a Vercel serverless function (`/api/skin?name=<username>`). It asks Mojang for the player's UUID and current skin and returns the PNG from the site's own domain, so it works for renamed players and the browser can read the pixels. Locally (no function), the page falls back to public skin services.

## Preview-only outfits (Founders Edition)

Outfits marked `locked: true` in `js/outfits.js` can be previewed in 3D but not downloaded. Their PNGs are **not in this repo** (it's public). Each is stored in a Vercel environment variable as base64 and served by `api/outfit.js`, XOR-scrambled with a fresh key per request, so there is no PNG URL, `<img>`, texture view or data URL to save. This deters copying but can't make it impossible: the browser has to draw the pixels.

Setup: in Vercel → Project → Settings → Environment Variables, add `FOUNDERS_PNG_B64` = the base64 of the Founders Edition PNG, then redeploy. Never commit that PNG here.

## Run

Open over HTTP (not `file://`), e.g. `python3 -m http.server`, or host on GitHub Pages.

## Add an outfit

1. Save a 64x64 PNG in `outfits/`. Leave areas transparent where skin should show; the head area is ignored.
2. Add an entry to `js/outfits.js` with one PNG per body: `classic` (4px arms) and `slim` (3px arms).

The body type is auto-detected from the uploaded skin and can be switched with the Classic / Slim toggle.

Shading strength is tuned in `js/skin.js` (`FACE_STEP`, `CAST_SHADOW`, `LIMB_END`, `shadeTone`).
