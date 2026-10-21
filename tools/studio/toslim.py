# Classic-arm skin textures to slim (3px arms) for slim players: drops the second column of
# each 4-wide arm face, base and overlay.   python3 tools/studio/toslim.py a.png [b.png ...] -> a-slim.png
import sys
from PIL import Image
def slim(src, dst):
    a = Image.open(src).convert('RGBA'); b = a.copy(); A, B = a.load(), b.load()
    for ox, oy in ((40, 16), (40, 32), (32, 48), (48, 48)):
        for y in range(oy, oy + 16):
            for x in range(ox + 4, ox + 16): B[x, y] = (0, 0, 0, 0)
        keep = (0, 2, 3)
        def cp(sx, sy, dx, dy, h, cols):
            for v in range(h):
                for i, c in enumerate(cols): B[dx + i, dy + v] = A[sx + c, sy + v]
        cp(ox + 4, oy, ox + 4, oy, 4, keep)             # top
        cp(ox + 8, oy, ox + 7, oy, 4, keep)             # bottom
        cp(ox + 4, oy + 4, ox + 4, oy + 4, 12, keep)    # front
        cp(ox + 8, oy + 4, ox + 7, oy + 4, 12, range(4))   # left
        cp(ox + 12, oy + 4, ox + 11, oy + 4, 12, keep)  # back
    b.save(dst)
if __name__ == '__main__':
    for f in sys.argv[1:]: slim(f, f.replace('.png', '-slim.png'))
