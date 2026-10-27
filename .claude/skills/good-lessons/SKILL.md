---
name: good-lessons
description: Hard rules learned from things that went wrong on good.leems.me — read before shipping any new piece, colourway, drop, private piece or MAKER® change, and before telling the owner something is done. Covers hoods, shoes, layers/z-fighting, tuck, sealed drops in the wardrobe, mobile stacking, testing with the real 3D viewer, and confirming deploys.
---

# What went wrong, and the rule now

Every rule here cost the owner a round trip. Check the list before you say "done".

## Pieces

1. **Seal every hood.** A hood (anything on the head's outer layer) gets its bottom face filled
   (hat layer x 48–55, y 0–7, about 0.85 of the main colour). Otherwise you can look up into it
   from below. Check the underside before sealing.
2. **Every bottom takes every shoe.** No bottom ships with one baked-in shoe. After making any
   bottom, run `GOOD_LOCK_KEY=… python3 tools/studio/reshoe.py` (regular bottoms) and
   `--drops` (GUD™/WANDERING® catalogues). Drop/private builders use the full shoe list,
   MARSHMALLOW™ loafer included. Then check MAKER® shows the SHOE row for it.
3. **No contrast pixels where the legs meet.** The two legs' outer layers overlap in 3D: the inner
   side faces (rleg `left`, lleg `right`) and the seam columns on front/back (rleg front u3 /
   back u0, lleg front u0 / back u3). Bright accents there flicker. Keep them on the outer sides.
4. **Accents go on both meanings of "side" only on purpose.** A rule like `s in ('left','right')`
   paints the inner side too. Name the outer side explicitly.
5. **A colourway is a colour, not a new item.** A special/private colourway joins the existing
   kind (same kind id; MAKER®'s addDrop merges it, extra colours last), never a duplicate card.
6. **Two-colour dots:** use a CSS background string if the owner asks for a shape (e.g. the
   "Pepsi" wave for ELK™/VOLT™); set it with `style.background`, never inside an HTML attribute.

## Tuck and layers

7. **Tucked = the pants own the waist all round.** The pants' waistband overwrites the shirt's base
   layer at the waist on every face, also under an open jacket. Don't fix a layering complaint by
   forcing untucked; ask what should win if it isn't obvious.

## MAKER® and pages

8. **Test with the real 3D viewer.** Headless runs without skinview3d hide stacking bugs. Route
   `**/skinview3d.bundle.js` to a local copy (`curl` it once) and launch Chromium with
   `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`, emulate a phone
   (`devices['iPhone 13']`), and check `elementFromPoint` on every button over the stage.
   The 3D canvas has `z-index: 1`; anything on the stage needs more.
9. **Size canvases before drawing.** A hidden/second canvas starts at 300×150; set width/height
   up front or the frames draw cropped and stretched.
10. **Anything that renders saved fits must know every catalogue.** The account and profile pages
    (js/compose.js) load the released drops and the private catalogue, and every piece from the
    server is sealed (`locked: true`). When a new drop or catalogue appears, add it there too.
11. **Cached UI rows:** a colour row cached per kind must redraw when the kind gains colours.
12. **Bump `?v=` on every changed script/stylesheet in every page that loads it.**

## People and access

13. **Don't invent sub-lines.** New pieces join their line by name (the sports bra is a DYNAMICS®
    piece). Never coin a label like "DYNAMICS® SPORT" unless the owner names it.
14. **Check who a name is.** Minecraft names and GOOD® names differ (globohomo123 = CHINNY).
    Look at /api/members before wiring access to a name; ask if no match.
15. **Private pieces:** owner + `PRIVATE_GUESTS` (profile slugs) in api/_account.js see and equip
    them. Others may see them on a profile but never equip them.

## Shipping

16. **Confirm the deploy, don't assume.** After a push, check
    `gh api repos/theliamladia/good-maker/commits/<sha>/status` until it says success. A sealed or
    private change can't be seen signed-out, so say exactly what you could and couldn't verify.
17. **Never chain `sleep`.** Poll with an until-loop on the status instead.

## The machine

18. **The cloud container is temporary.** It gets recycled, and only git survives: the scratchpad
    (and GOOD_LOCK_KEY in it), `tools/studio/work/`, downloaded models and the local test data all go.
    Keep GOOD_LOCK_KEY in the cloud environment's settings, never only in a file. Send the owner a zip
    (SendUserFile) of any design work that isn't in git as soon as it exists, and say so.
19. **Keep the privacy policy current.** Any change that stores something new, shows something
    publicly, adds a service that receives data, or changes what DELETE ACCOUNT removes updates
    privacy.html (and its "Last updated" date) in the same push.
20. **Never show a player half-dressed.** A piece is shown worn only as part of a full outfit. On
    drop pages the looks are floating outfits; a single piece on a player shows their bare skin
    (shirtless, bare legs) and must not ship. If you ever doubt a render, look at it as the owner
    would before you push.
