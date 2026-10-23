# GOOD®: notes for Claude

## Art direction (press kits, concept sheets, landing pages, share images)

GOOD® is quiet luxury. Every visual asset follows these rules:

- **The GOOD® look is COLLABORATIONS® (collab.css).** GOOD® BLUE (#0000ff) background, white type. Inter for headlines and copy, Space Mono for small tracked labels (about 0.72rem, letter-spacing 0.22em). Thin 1px white rules between sections. Not the STUDY® style (paper, serif): that belongs to STUDY® only.
- **Not too bold.** Headlines in Inter 500–600 with slightly tight tracking, never the heaviest weights. Copy in Inter 300–400 with line height 1.55+.
- **Pieces on GOOD® BLUE sit in a spotlight.** No cards or panels: a soft white radial glow behind each piece (white at about 55% in the centre, fading to nothing) so GOOD® BLUE clothing still separates from the ground. Show the piece on its own, front view (not a quarter turn): tops zoomed in on the garment, trousers on their own. Under each piece: one dot per colour of the colourway, then its name (GOOD® BLUE/COTTON™).
- **Colours as THE COLOR STORY®.** On sheets, the palette is a strip of vertical bars (no names) under the label THE COLOR STORY®, not a row of named swatches.
- **Copy.** At most three sentences, in the WANDERING® voice: scene first, then what you wear.
- **Negative space first.** Give everything far more room than feels necessary. Nothing fills the frame edge to edge; aim for 30–40% empty. Wide outer margins (8–10% of the width), generous gaps.
- **Fewer things.** Three or four figures per row at most, never six.
- **Calm hierarchy.** One headline, the copy, then the work. No speed lines, busy patterns or stacked subtitles.

When in doubt: remove something, and add space.

## Naming

- Always write GOOD®. MAKER® (not "THE MAKER"). The brand is GOOD® (not "GOOD® DESIGN").
- Colourway names are ALL CAPS; colours take ™ (UNIQUE uses ⓤ).
- Previews stay previews (unlisted, not in MAKER®) until the owner says ship.

## Security

- Never store passwords or GOOD_LOCK_KEY in the repo.
- Preview and locked pieces are sealed (tools/lock-seal.js) and drawn to canvas from scrambled data. Never publish their PNGs.

## Designing pieces

- Follow "How we design a piece" in `.claude/skills/good-studio/SKILL.md` (start from the line, one idea then remove, shade don't recolour, quiet fabric, fit through layers, write the spec, show it the house way). The owner approved this approach on the UBIQUITY® HOODIE®.
- **Seal every hood.** A hood (or anything on the head's outer layer) gets its bottom face filled too, shaded about 0.85, so there's no gap when the model is seen from below. Check the hat-layer underside (x 48–55, y 0–7) before sealing a piece.

## Tools and skills

- Project skills in `.claude/skills/`: good-studio (paint and render pieces), good-sheets (concept/look/press sheets, the drop calendar), good-seal (sealed previews), good-collab-page (collab landing pages), good-dev-check (local site + QA), good-ship (push to main and confirm the Vercel deploy), good-lessons (hard rules from past mistakes: read before saying anything is done).
- `tools/studio/` is the render studio, `tools/dev/` the local site (fake Redis) and page checker. Renders and downloads go in `tools/studio/work/` (gitignored).
