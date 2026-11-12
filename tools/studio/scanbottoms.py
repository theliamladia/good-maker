# Scan every bottom (public files and sealed ones) for two known bugs:
#  WAIST: template denim blue left in the torso rows (the waistband) of a bottom whose legs aren't denim blue
#  SEAM:  contrast pixels on the legs' outer-layer inner columns, where the two legs overlap and flicker
#   GOOD_LOCK_KEY=... python3 tools/studio/scanbottoms.py [--fix]
import os, re, sys, json, glob, base64, subprocess, colorsys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.argv.append('--none'); sys.path.insert(0, os.path.dirname(__file__))
import reshoe as R   # unseal/seal helpers and the catalogue reader
FIX = '--fix' in sys.argv
def isdenim(p):
    r, g, b, a = p
    if not a: return False
    mx, mn = max(r, g, b), min(r, g, b)
    return mx == b and mx - mn >= 60 and 180 <= 240 + 60 * (r - g) / max(1, mx - mn) <= 215
def lum(p): return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]
# The two legs' outer layers overlap where they meet: the right leg's inner column and the left leg's
# inner column are drawn in the same place, so any difference between them flickers. Pairs per row:
# (right leg x, y0) with (left leg x, y0): front faces, then back faces; 12 rows each.
PAIRS = [((7, 36), (4, 52)), ((12, 36), (15, 52))]
def scan(im):
    px = im.load()
    legs = [px[x, y] for x0, y0 in ((4, 20), (4, 36), (20, 52), (4, 52)) for x in range(x0, x0 + 4) for y in range(y0, y0 + 9) if px[x, y][3]]
    blue_legs = sum(isdenim(p) for p in legs) > len(legs) * 0.3
    waist = [] if blue_legs else [(x, y) for y in list(range(16, 32)) + list(range(32, 48)) for x in range(16, 40) if isdenim(px[x, y])]
    seam = []
    for (rx, ry), (lx, ly) in PAIRS:
        for v in range(12):
            p, q = px[rx, ry + v], px[lx, ly + v]
            if p[3] and q[3] and (abs(lum(p) - lum(q)) > 25 or max(abs(a - b) for a, b in zip(p[:3], q[:3])) > 40):
                seam.append((rx, ry + v, lx, ly + v))
    return waist, seam, legs
def fix(im, waist, seam, legs):
    px = im.load()
    if waist:   # the waistband takes the legs' own main colour, shade kept
        from collections import Counter
        main = Counter(p[:3] for p in legs).most_common(1)[0][0]
        for x, y in waist:
            k = lum(px[x, y]) / max(1, 0.299 * 55 + 0.587 * 186 + 0.114 * 247)
            k = 1 + (k - 1) * 0.6
            px[x, y] = tuple(max(0, min(255, round(c * k))) for c in main) + (255,)
    if seam:   # both take the fabric: whichever of the pair is closer to the legs' usual colour
        from statistics import median
        m = median(lum(p) for p in legs) if legs else 128
        for rx, ry, lx, ly in seam:
            p, q = px[rx, ry], px[lx, ly]
            keep = p if abs(lum(p) - m) <= abs(lum(q) - m) else q
            px[rx, ry] = keep; px[lx, ly] = keep
    return im
files = {}
for f in glob.glob(os.path.join(ROOT, 'outfits', '**', '*.png'), recursive=True):
    rel = os.path.relpath(f, ROOT)
    if '/pants' in rel or 'pants-' in os.path.basename(rel): files[rel] = ('file', f)
for f in glob.glob(os.path.join(ROOT, 'api', '_locked', '*.enc')):
    i = os.path.basename(f)[:-4]
    if re.match(r'^(c2-jean|c2-baby-tights|c3-(lounge-pant|carry-on|flight-cargo|crew-trouser|tech-jogger|pilot-short|contrail-wide|yoga-pant|wide-leg)|wdm-(heritage-jean|baggy|trail|cargo)|qgm-(fencing-pant|biker|studded)|aim-jean|aim-baby-tights|deep)', i): files[i] = ('sealed', i)
hits = []
for name, (kind, ref) in sorted(files.items()):
    im = R.load(ref) if kind == 'file' else R.unseal(ref)
    if im.size != (64, 64): continue
    w, s, legs = scan(im)
    if w or s:
        hits.append((name, len(w), len(s)))
        if FIX:
            im = fix(im, w, s, legs)
            if kind == 'file': im.save(ref)
            else: R.seal(ref, im)
for h in hits: print(h)
print(len(hits), 'of', len(files), 'bottoms', 'fixed' if FIX else 'need fixing')
