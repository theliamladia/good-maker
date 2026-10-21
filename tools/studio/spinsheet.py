# Turntable frames -> one sheet per look (frames side by side) + a still (frame 0), cropped to a
# shared box so every look sits at the same scale, feet on the bottom edge.
#   python3 tools/studio/spinsheet.py <frames dir> <out dir> id1 id2 ... [--fw=202 --fh=407]
# Reads <frames dir>/<id>-NN.png, writes <out dir>/<id>-spin.webp and <out dir>/<id>.png.
# These are preview images: seal them (tools/lock-seal.js), never commit them.
import sys, glob, os
from PIL import Image
args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = dict(a[2:].split('=') for a in sys.argv[1:] if a.startswith('--'))
FW, FH = int(opt.get('fw', 202)), int(opt.get('fh', 407))
src, out, ids = args[0], args[1], args[2:]
os.makedirs(out, exist_ok=True)
frames = {i: sorted(glob.glob(f'{src}/{i}-[0-9][0-9].png')) for i in ids}
box = None
for fs in frames.values():
    for f in fs:
        b = Image.open(f).getbbox()
        if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
w, h = box[2] - box[0], box[3] - box[1]; k = min(FW / w, FH / h); nw, nh = round(w * k), round(h * k)
for i, fs in frames.items():
    sheet = Image.new('RGBA', (FW * len(fs), FH), (0, 0, 0, 0))
    for n, f in enumerate(fs):
        sheet.alpha_composite(Image.open(f).crop(box).resize((nw, nh), Image.LANCZOS), (n * FW + (FW - nw) // 2, FH - nh))
    sheet.save(f'{out}/{i}-spin.webp', lossless=True)
    sheet.crop((0, 0, FW, FH)).save(f'{out}/{i}.png')
    print(i, len(fs), 'frames')
