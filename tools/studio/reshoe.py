# EVERY BOTTOM, EVERY SHOE. Gives each bottom in js/outfits.js every shoe it's missing.
#   GOOD_LOCK_KEY=... python3 tools/studio/reshoe.py
# Each bottom was drawn over a JEAN® template (good-jean-<shoe>.png, the bootcut, or the
# sagging jean) with one shoe baked in. We find which template and shoe, then swap only the
# shoe: where the bottom still shows the template's shoe it takes the new shoe's pixels,
# and where a lower shoe leaves leg showing, the bottom's own fabric carries on down from
# the row above. Public bottoms go to outfits/pants/shoes/, sealed ones (api/outfit?id=)
# are sealed straight into api/_locked/. The new files are listed in a generated block at
# the end of js/outfits.js.
import base64, json, os, re, subprocess, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
R = os.path.join(ROOT, 'outfits', 'pants')
SHOES = ['black', 'brown', 'tobacco', 'marshmallow', 'sneak01', 'chelsea-tobacco', 'chelsea-tuxedo', 'chelsea-mahogany',
         'workboot-wheat', 'workboot-oxblood', 'workboot-tuxedo', 'duck-peyote', 'duck-inkwell-after-hours', 'duck-chocolate-cacao']
if len(base64.b64decode(os.environ.get('GOOD_LOCK_KEY', ''))) != 32: sys.exit('GOOD_LOCK_KEY (32 bytes, base64) is needed for the sealed bottoms')

def isdenim(p):
    r, g, b = p[:3]; mx, mn = max(r, g, b), min(r, g, b)
    return p[3] and mx == b and mx - mn >= 60 and 190 <= 240 + 60 * (r - g) / (mx - mn) <= 207
def load(path):
    return Image.open(path).convert('RGBA')
NODE_CRYPT = """
const fs = require('fs'), c = require('crypto'), [op, file, id] = process.argv.slice(1);
const key = Buffer.from(process.env.GOOD_LOCK_KEY, 'base64'), enc = require('path').join(process.env.ROOT, 'api', '_locked', id + '.enc');
if (op === 'unseal') { const { iv, tag, data } = JSON.parse(fs.readFileSync(enc, 'utf8')); const d = c.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64')); d.setAuthTag(Buffer.from(tag, 'base64')); fs.writeFileSync(file, Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()])); }
else { const iv = c.randomBytes(12), e = c.createCipheriv('aes-256-gcm', key, iv); const data = Buffer.concat([e.update(fs.readFileSync(file)), e.final()]); fs.writeFileSync(enc, JSON.stringify({ iv: iv.toString('base64'), tag: e.getAuthTag().toString('base64'), data: data.toString('base64') })); }
"""
TMP = os.path.join(ROOT, 'tools', 'studio', 'work', 'reshoe.png')   # (gitignored)
def crypt(op, i):
    subprocess.run(['node', '-e', NODE_CRYPT, op, TMP, i], check=True, env={**os.environ, 'ROOT': ROOT})
def unseal(i):
    crypt('unseal', i); return load(TMP)
def seal(i, im):
    im.save(TMP); crypt('seal', i)
def source(ref):
    m = re.match(r'api/outfit\?id=([a-z0-9-]+)$', ref)
    return (unseal(m.group(1)), True) if m else (load(os.path.join(ROOT, ref)), False)

# The templates: every family, every shoe it has a file for.
FAM = {}
for fam, pre, default in (('jean', 'good-jean-', 'black'), ('bootcut', 'good-jean-bootcut-', 'black'), ('sagging', 'good-jean-sagging-', None)):
    T = {}
    for s in SHOES:
        f = os.path.join(R, f'{pre}{s}.png') if not (fam == 'sagging' and s == 'black') else os.path.join(R, 'good-jean-sagging.png')
        if os.path.exists(f): T[s] = load(f).load()
    FAM[fam] = T
def zone(T):   # every pixel where any two of the family's shoes differ
    ks = list(T); z = set()
    for x in range(64):
        for y in range(64):
            if len({T[k][x, y] for k in ks}) > 1: z.add((x, y))
    return z
ZONE = {f: zone(T) for f, T in FAM.items()}
def detect(P):
    """The template and shoe baked into P, and how sure: the share of that shoe's pixels P still shows."""
    px = P.load(); best = (-1, None, None)
    for f, T in FAM.items():
        for s, t in T.items():
            shoe = [(x, y) for x, y in ZONE[f] if t[x, y][3] and not isdenim(t[x, y])]
            r = sum(1 for x, y in shoe if px[x, y] == t[x, y]) / max(1, len(shoe))
            if r > best[0]: best = (r, f, s)
    return best[1], best[2], best[0]
def overlay(P, k):
    """For a bottom with no template shoe (its own, or none): the new shoe, drawn over it."""
    out = P.copy(); o, t = out.load(), FAM['jean'][k]
    for x, y in ZONE['jean']:
        if t[x, y][3] and not isdenim(t[x, y]): o[x, y] = t[x, y]
    return out
def reshoe(P, fam, s0, k):
    # A shoe the family has no file for (sagging: brown, marshmallow): swap it in from the
    # plain JEAN®, whose shoes sit in the same place.
    if k not in FAM[fam]: fam_k, s0_k = 'jean', s0 if s0 in FAM['jean'] else 'black'
    else: fam_k, s0_k = fam, s0
    t0, tk = FAM[fam_k][s0_k], FAM[fam_k][k]
    out = P.copy(); p, o = P.load(), out.load()
    z = {(x, y) for x in range(64) for y in range(64) if t0[x, y] != tk[x, y]}
    for y in range(64):                      # top down, so fabric carried down is already final
        for x in range(64):
            if (x, y) not in z: continue
            a, b, c = p[x, y], t0[x, y], tk[x, y]
            if a == b:                       # the bottom still shows the old shoe (or template) here
                if isdenim(c) and not isdenim(b):
                    yy = y - 1               # leg shows where the old shoe was: the bottom's own fabric carries on
                    while yy >= 0 and (x, yy) in z and isdenim(tk[x, yy]) and not isdenim(t0[x, yy]): yy -= 1
                    o[x, y] = o[x, yy] if yy >= 0 else c
                else: o[x, y] = c
            elif c[3] and not isdenim(c): o[x, y] = c   # the new shoe goes over the bottom's own design
    return out

def pants():
    js = subprocess.run(['node', '-e', """
const w = {}; require('vm').runInNewContext(require('fs').readFileSync(process.argv[1], 'utf8').split('// ---- EVERY BOTTOM, EVERY SHOE')[0], { window: w });
console.log(JSON.stringify(w.PANTS));""", os.path.join(ROOT, 'js', 'outfits.js')], capture_output=True, text=True, check=True).stdout
    return json.loads(js)

def main():
    os.makedirs(os.path.join(R, 'shoes'), exist_ok=True)
    extra = {}
    for kind in pants():
        for c in kind.get('colors') or [kind]:
            have = dict(c.get('shoes') or kind.get('shoes') or {})
            src_ref = have.get('black') or (next(iter(have.values())) if have else c.get('src'))
            P, sealed = source(src_ref)
            fam, s0, sure = detect(P)
            add = {}
            if sure < 0.9: fam = None           # its own shoe (or none): draw every shoe over it
            elif not have:                       # a single-file bottom: its own shoe comes first (the default)
                add[s0] = c['src']
            for k in SHOES:
                if k in have or k in add: continue
                im = reshoe(P, fam, s0, k) if fam else overlay(P, k)
                fid = f"{c['id']}-{k}"
                if sealed: seal(fid, im); add[k] = f'api/outfit?id={fid}'
                else: im.save(os.path.join(R, 'shoes', f'{fid}.png')); add[k] = f'outfits/pants/shoes/{fid}.png'
            if add: extra[c['id']] = add
            print(f"{c['id']:44} {fam or 'overlay':8} {s0:24} {sure:.2f} +{len(add)}")
    block = ('// ---- EVERY BOTTOM, EVERY SHOE (generated by tools/studio/reshoe.py: don\'t edit by hand) ----\n'
             '(() => {\n  const EXTRA = ' + json.dumps(extra, separators=(',', ':')) + ';\n'
             '  for (const k of window.PANTS) for (const c of k.colors || [k]) {\n'
             '    if (EXTRA[c.id]) c.shoes = { ...(c.shoes || k.shoes || {}), ...EXTRA[c.id] };\n'
             '  }\n})();\n')
    f = os.path.join(ROOT, 'js', 'outfits.js'); s = open(f).read().split('// ---- EVERY BOTTOM, EVERY SHOE')[0].rstrip() + '\n\n'
    open(f, 'w').write(s + block)
    print('bottoms with new shoes:', len(extra))

if __name__ == '__main__' and '--drops' not in sys.argv: main()

# ---- The drops (GUD™, WANDERING®: sealed catalogues in api/_locked) ----
#   GOOD_LOCK_KEY=... python3 tools/studio/reshoe.py --drops
# Their bottoms come in every shoe but the newest; the MARSHMALLOW™ loafer has the loafer's
# shape, so it's the MAHOGANY™ loafer's pixels (where the black and brown files differ)
# recoloured, shading kept.
MARSH = (0xf7, 0xf2, 0xea)
def marshmallow(black, brown):
    lum = lambda p: 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]
    out = brown.copy(); a, b, o = black.load(), brown.load(), out.load()
    L0 = lum((66, 16, 18))                 # the MAHOGANY™ loafer's main tone
    for x in range(64):
        for y in range(64):
            p = b[x, y]
            if a[x, y] != p and p[3] and not isdenim(p):
                k = min(1.06, lum(p) / L0); o[x, y] = tuple(min(255, round(ch * k)) for ch in MARSH) + (p[3],)
    return out
def unseal_json(i):
    crypt('unseal', i); return json.load(open(TMP))
def seal_json(i, obj):
    open(TMP, 'w').write(json.dumps(obj, ensure_ascii=False)); crypt('seal', i)
def drops():
    for idx in ('gud-index', 'wdm-index'):
        cat = unseal_json(idx)
        for k in cat['pants']:
            for c in k['colors']:
                sh = c['shoes']
                if 'marshmallow' in sh: continue
                bl, _ = source(sh['black']); br, _ = source(sh['brown'])
                fid = re.match(r'api/outfit\?id=(.+)-black$', sh['black']).group(1) + '-marshmallow'
                seal(fid, marshmallow(bl, br))
                c['shoes'] = {**{s: v for s, v in sh.items() if s in ('black', 'brown', 'tobacco')}, 'marshmallow': f'api/outfit?id={fid}', **sh}
                print(idx, c['id'], '+marshmallow')
        seal_json(idx, cat)

if __name__ == '__main__' and '--drops' in sys.argv: drops()
