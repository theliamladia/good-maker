# GOOD® studio: helpers for painting Minecraft skin garments (64x64, classic arms).
#   exec(open('tools/studio/lib.py').read())   # or: sys.path.insert(0, 'tools/studio'); from lib import *
# Coordinates: every part is a box unwrapped into faces; paint(part, fn) calls fn(side, u, v, w, h)
# for each pixel of each face (u across, v down; torso front is 8x12, arms and legs 4x12) and
# writes whatever colour fn returns (None leaves the pixel). layer='base' is layer 1, 'over' is layer 2.
import math, random
from PIL import Image

H = lambda s: tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))
C = lambda s: H(s) + (255,)
def sh(c, k): return tuple(max(0, min(255, round(v * k))) for v in c[:3]) + (255,)
def tex(c, amt=0.05): return sh(c, 1 + random.uniform(-amt, amt))
FK = {'front': 1.0, 'right': 0.9, 'left': 0.9, 'back': 0.84, 'top': 1.06, 'bottom': 0.75}   # face lighting
def sd(c, s, k=1.0, amt=0.03): return tex(sh(c, FK[s] * k), amt)

def faces(ox, oy, w, d, h):
    return {'top': (ox + d, oy, w, d), 'bottom': (ox + d + w, oy, w, d), 'right': (ox, oy + d, d, h),
            'front': (ox + d, oy + d, w, h), 'left': (ox + d + w, oy + d, d, h), 'back': (ox + 2 * d + w, oy + d, w, h)}
PART = {   # base faces, and the offset from base to the overlay (layer 2)
    'torso': (faces(16, 16, 8, 4, 12), (0, 16)),
    'rarm': (faces(40, 16, 4, 4, 12), (0, 16)),
    'larm': (faces(32, 48, 4, 4, 12), (16, 0)),
    'rleg': (faces(0, 16, 4, 4, 12), (0, 16)),
    'lleg': (faces(16, 48, 4, 4, 12), (-16, 0)),
}
HEAD, HAT = faces(0, 0, 8, 8, 8), faces(32, 0, 8, 8, 8)
def new(): return Image.new('RGBA', (64, 64), (0, 0, 0, 0))
def paint(im, part, fn, layer='base'):
    f, (dx, dy) = PART[part]; px = im.load()
    for side, (x, y, w, h) in f.items():
        for v in range(h):
            for u in range(w):
                c = fn(side, u, v, w, h)
                if c in (None, 'skip'): continue
                X, Y = (x + u + dx, y + v + dy) if layer == 'over' else (x + u, y + v)
                px[X, Y] = c

# The new G, 4x4 (the SHIRT® sits it at ox=2, oy=2 on the torso front).
NG = ['.###', '#...', '#..#', '.###']
def ng(s, u, v, ox, oy, face='front'):
    gu, gv = u - ox, v - oy
    return s == face and 0 <= gu < 4 and 0 <= gv < 4 and NG[gv][gu] == '#'

def tee(im, col):
    """A plain base-layer torso, so nothing shows under an open or cropped jacket."""
    paint(im, 'torso', lambda s, u, v, w, h: sd(col, s, 1, 0.015))
def coat(im, col, rows=12, sleeve=12, fn=None, sfn=None, collar=None, cuff=0.82, amt=0.035):
    """A jacket on layer 2 (torso + sleeves), base sleeves under it. fn/sfn override pixels."""
    def t(s, u, v, w, h):
        if s == 'top': return sd(collar or col, s)
        if s == 'bottom': return sd(col, s) if rows == 12 else None
        if v >= rows: return None
        r = fn(s, u, v, w, h) if fn else None
        if r is not None: return r
        if collar and v == 0 and s != 'front': return sd(collar, s)
        if v == rows - 1: return sd(col, s, 0.84)
        return sd(col, s, 1, amt)
    paint(im, 'torso', t, 'over')
    def a(s, u, v, w, h):
        if s == 'bottom': return sd(col, s) if sleeve == 12 else None
        if s != 'top' and v >= sleeve: return None
        r = sfn(s, u, v, w, h) if sfn else None
        if r is not None: return r
        if s != 'top' and v == sleeve - 1: return sd(col, s, cuff)
        return sd(col, s, 1, amt)
    for arm in ('rarm', 'larm'):
        paint(im, arm, a, 'over')
        paint(im, arm, lambda s, u, v, w, h: None if s != 'top' and v >= sleeve else sd(col, s, 0.8))
def legs(fn, boot=C('#0e0e10')):
    """Trousers from scratch: fn(leg, side, u, v) for rows 0-9, boots on rows 10-11."""
    p = new()
    for lg in ('rleg', 'lleg'):
        def l(s, u, v, w, h, lg=lg):
            if s == 'bottom': return sh(boot, 0.8)
            if v >= 11: return sd(boot, s)
            if v == 10: return sd(boot, s, 1.5)
            return fn(lg, s, u, v)
        paint(p, lg, l)
    return p

# ---------- layers ----------
def flatten_top(im, keep_collar=True):
    """Move a top from layer 2 down to layer 1 (prints flat); the collar row stays on layer 2."""
    px = im.load()
    for part in ('torso', 'rarm', 'larm'):
        f0, (dx, dy) = PART[part]
        for side, (x, y, w, h) in f0.items():
            for v in range(h):
                for u in range(w):
                    o = px[x + u + dx, y + v + dy]
                    collar = keep_collar and part == 'torso' and (v == 0 or side == 'top')
                    if o[3] and not collar: px[x + u, y + v] = o; px[x + u + dx, y + v + dy] = (0, 0, 0, 0)
    return im
def lift_pants(im):
    """Copy trousers up to layer 2 (reads baggy); layer 1 stays under so no skin shows."""
    px = im.load()
    for part in ('rleg', 'lleg'):
        f0, (dx, dy) = PART[part]
        for side, (x, y, w, h) in f0.items():
            for v in range(h):
                for u in range(w):
                    b, o = px[x + u, y + v], px[x + u + dx, y + v + dy]
                    if b[3] and not o[3]: px[x + u + dx, y + v + dy] = b
    return im
def neck(col):
    """A high collar carried onto the head's layer 2: the bottom rows round the neck, only the
    corner squares at the front so the face stays clear. Use as the look's accFile."""
    im = new(); px = im.load()
    for side, (x, y, w, h) in HAT.items():
        for v in range(h):
            for u in range(w):
                if side in ('top', 'bottom'): continue
                if side == 'front' and not (v == 7 and u in (0, 1, 6, 7)): continue
                if side != 'front' and v < 6: continue
                px[x + u, y + v] = sd(col, side, 0.92 if v == 7 else 1)
    return im

def art(rows, pal, scale=20):
    """Flat pixel art (accessories on sheets): rows of chars, pal = {char: colour}."""
    h, w = len(rows), max(len(r) for r in rows)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in pal: px[x, y] = pal[ch]
    return im.resize((w * scale, h * scale), Image.NEAREST)
