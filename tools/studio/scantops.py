# Tops that still carry the JEAN® template's blue waistband in the torso's bottom rows (layer 1 rows 26-31,
# layer 2 rows 42-47). Under pants it's hidden; with a crop top or low pants it shows as a blue band.
# --fix: each such pixel takes the top's own fabric from the row above (a hem), or goes clear if the
# row above is empty (a crop top: skin shows, as it should).   GOOD_LOCK_KEY=... python3 tools/studio/scantops.py [--fix]
import os, re, sys, glob
from PIL import Image
sys.argv.append('--none'); sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import reshoe as R
ROOT = R.ROOT; FIX = '--fix' in sys.argv
def isdenim(p):
    r, g, b, a = p
    if not a: return False
    mx, mn = max(r, g, b), min(r, g, b)
    return mx == b and mx - mn >= 60 and 185 <= 240 + 60 * (r - g) / max(1, mx - mn) <= 210
def fabric_is_denim(px):   # the top's own body (torso front, rows 20-25) is denim blue: leave it alone
    body = [px[x, y] for x in range(20, 28) for y in range(20, 26) if px[x, y][3]] + [px[x, y] for x in range(20, 28) for y in range(36, 42) if px[x, y][3]]
    return body and sum(isdenim(p) for p in body) > len(body) * 0.4
ROWS = [(y, 25) for y in range(26, 32)] + [(y, 41) for y in range(42, 48)]
def scan_fix(im):
    px = im.load()
    if fabric_is_denim(px): return 0
    n = 0
    for y, top in ROWS:
        for x in range(16, 40):
            if isdenim(px[x, y]):
                n += 1
                if FIX:
                    above = px[x, y - 1]
                    px[x, y] = above if (above[3] and not isdenim(above)) else (0, 0, 0, 0)
    return n
refs = set()
for f in glob.glob(os.path.join(ROOT, 'outfits', '*.png')) + glob.glob(os.path.join(ROOT, 'outfits', 'deep', 'goodie-*.png')):
    refs.add(('file', f))
src = open(os.path.join(ROOT, 'js', 'outfits.js')).read()
for i in set(re.findall(r"api/outfit\?id=([a-z0-9-]+)", src)):
    if os.path.exists(os.path.join(ROOT, 'api', '_locked', i + '.enc')) and not re.search(r'(jean|pant|trouser|jogger|short|cargo|tights|scarf|mask|pillow)', i): refs.add(('sealed', i))
hits = []
for kind, ref in sorted(refs):
    im = R.load(ref) if kind == 'file' else R.unseal(ref)
    if im.size != (64, 64): continue
    n = scan_fix(im)
    if n:
        hits.append((os.path.relpath(ref, ROOT) if kind == 'file' else ref, n))
        if FIX: im.save(ref) if kind == 'file' else R.seal(ref, im)
for h in hits: print(h)
print(len(hits), 'tops', 'fixed' if FIX else 'carry the blue waistband')
