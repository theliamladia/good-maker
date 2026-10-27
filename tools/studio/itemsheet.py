# Turntable frames of single items -> one square sheet per item (frames side by side) + a still,
# each item centred in its frame. Every item is scaled by the same factor (the tightest fit), so a
# hoodie and an eye mask keep their real sizes against each other and nothing clips.
#   python3 tools/studio/itemsheet.py <frames dir> <out dir> id1 id2 ... [--f=320]
# These are preview images: seal them (tools/lock-seal.js), never commit them.
import sys, glob, os, statistics
from PIL import Image, ImageChops, ImageFilter
# The hidden body leaves one-pixel lines where its faces turn edge-on: an opening (erode, then
# dilate) of the alpha removes them and keeps every real shape.
def clean(im):
    im = im.convert('RGBA'); a = im.getchannel('A')
    keep = a.point(lambda v: 255 if v > 60 else 0).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    im.putalpha(ImageChops.multiply(a, keep)); return im
args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = dict(a[2:].split('=') for a in sys.argv[1:] if a.startswith('--'))
F = int(opt.get('f', 320)); M = 0.86                      # the item fills at most 86% of the frame
src, out, ids = args[0], args[1], args[2:]
os.makedirs(out, exist_ok=True)
frames = {i: sorted(glob.glob(f'{src}/{i}-[0-9][0-9].png')) for i in ids}
boxes = {}
for i, fs in frames.items():
    box = None
    for f in fs:
        b = clean(Image.open(f)).getbbox()
        if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    boxes[i] = box
fit = {i: min(F * M / (b[2] - b[0]), F * M / (b[3] - b[1])) for i, b in boxes.items()}
ref = min(fit.values())                          # one scale for all: real sizes, nothing clipped
for i, fs in frames.items():
    b = boxes[i]; k = min(fit[i], ref); w, h = round((b[2] - b[0]) * k), round((b[3] - b[1]) * k)
    sheet = Image.new('RGBA', (F * len(fs), F), (0, 0, 0, 0))
    for n, f in enumerate(fs):
        sheet.alpha_composite(clean(Image.open(f)).crop(b).resize((w, h), Image.LANCZOS), (n * F + (F - w) // 2, (F - h) // 2))
    sheet.save(f'{out}/{i}-spin.webp', lossless=True)
    sheet.crop((0, 0, F, F)).save(f'{out}/{i}.png')
    print(i, len(fs), 'frames', round(k, 3))
