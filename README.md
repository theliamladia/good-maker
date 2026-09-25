# GOOD® Maker

Static site that dresses a Minecraft skin in a preset outfit.

- Keeps the user's **head + hat layer** from their uploaded skin.
- Fills arms, legs and torso with a **skin tone** (auto-detected from the face, picked with the colour picker, or clicked on the face preview).
- Shades that tone per face (lit from above/front, darker inner sides/back/bottom, cast shadows under sleeves and hems, hue-shifted shadows). The same rules apply to any chosen colour.
- Keeps **long hair** that hangs onto the torso (on by default for Slim bodies; Off / Short / Mid / Long control), with a 1-pixel eraser map to brush unwanted hair pixels back to the outfit. Hair is found by flooding down from the neckline through hair-coloured pixels, skipping colours that are the old outfit.
- Draws the **outfit** pixels on top, then shows a live 3D preview and a download button.

## Run

Open over HTTP (not `file://`), e.g. `python3 -m http.server`, or host on GitHub Pages.

## Add an outfit

1. Save a 64x64 PNG in `outfits/`. Leave areas transparent where skin should show; the head area is ignored.
2. Add an entry to `js/outfits.js` with one PNG per body: `classic` (4px arms) and `slim` (3px arms).

The body type is auto-detected from the uploaded skin and can be switched with the Classic / Slim toggle.

Shading strength is tuned in `js/skin.js` (`FACE_STEP`, `CAST_SHADOW`, `LIMB_END`, `shadeTone`).
