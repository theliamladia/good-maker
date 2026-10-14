// Seal owner-only pieces for THE MAKER.
//   GOOD_LOCK_KEY=<base64 32 bytes> node tools/private-seal.js <folder>
// The folder holds catalog.json ({ tops: [kinds], pants: [kinds]} in the js/outfits.js
// shape, file names in bodies/src) plus those PNGs. Each PNG is sealed with AES-256-GCM
// under GOOD_LOCK_KEY into api/_private/<random id>.enc, and the catalogue (pointing at
// api/outfit?id=<random id>) into api/_private/index.enc. /api/outfit only opens them
// for the owner's session; to anyone else they don't exist. Keep the folder out of git.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
const dir = process.argv[2];
if (key.length !== 32 || !dir) { console.error('usage: GOOD_LOCK_KEY=... node tools/private-seal.js <folder>'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'api', '_private');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const seal = (buf) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([c.update(buf), c.final()]);
  return JSON.stringify({ iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') });
};
const ids = new Map();   // file name -> random id (a file used twice is sealed once)
const ref = (name) => {
  if (!ids.has(name)) {
    const id = crypto.randomBytes(8).toString('hex');
    fs.writeFileSync(path.join(OUT, `${id}.enc`), seal(fs.readFileSync(path.join(dir, name))));
    ids.set(name, id);
  }
  return `api/outfit?id=${ids.get(name)}`;
};
const cat = JSON.parse(fs.readFileSync(path.join(dir, 'catalog.json'), 'utf8'));
for (const k of [...cat.tops, ...cat.pants]) {
  k.locked = true;   // served scrambled, like the other preview pieces
  for (const c of k.colors) {
    for (const set of ['bodies', 'long']) if (c[set]) for (const b of Object.keys(c[set])) c[set][b] = ref(c[set][b]);
    if (c.src) c.src = ref(c.src);
    if (c.shoes) for (const s of Object.keys(c.shoes)) c.shoes[s] = ref(c.shoes[s]);
  }
}
fs.writeFileSync(path.join(OUT, 'index.enc'), seal(Buffer.from(JSON.stringify(cat))));
console.log(`sealed ${ids.size} files and the catalogue into api/_private`);
