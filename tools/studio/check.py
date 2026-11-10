# Check garment textures before they're sealed or shipped. Fails (exit 1) on:
#   - anything on the lower rows of the head's outer layer (a hood, collar or neck reaching rows 6-7,
#     where it meets the shoulders) with an unfilled underside (hat bottom face, x 48-55, y 0-7):
#     you'd see up into it from below. A band higher up (an eye mask) needs no floor.
#   python3 tools/studio/check.py <png> [<png> ...]
# Run it on every texture that goes into MAKER® or a render (build scripts call it).
import sys
from PIL import Image
HAT = {'front': (40, 8, 8, 8), 'right': (32, 8, 8, 8), 'left': (48, 8, 8, 8), 'back': (56, 8, 8, 8)}
BOTTOM = (48, 0, 8, 8)
def problems(path):
    im = Image.open(path).convert('RGBA'); px = im.load(); out = []
    on_head = sum(1 for (X, Y, W, H) in HAT.values() for x in range(X, X + W) for y in range(Y + 6, Y + H) if px[x, y][3])
    x0, y0, w, h = BOTTOM
    empty = sum(1 for x in range(x0, x0 + w) for y in range(y0, y0 + h) if not px[x, y][3])
    if on_head and empty: out.append(f'collar or hood on the head lower rows ({on_head} px) but its underside has {empty} empty px: seal it (lib.seal_under)')
    return out
if __name__ == '__main__':
    bad = 0
    for p in sys.argv[1:]:
        for msg in problems(p): print(f'FAIL {p}: {msg}'); bad += 1
    print('check:', 'ok' if not bad else f'{bad} problem(s)'); sys.exit(1 if bad else 0)
