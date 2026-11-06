// Add owner-only pieces to the sealed catalogue that's already in api/_private, keeping every
// piece in it (tools/private-seal.js rebuilds the whole catalogue from one folder instead).
//   GOOD_LOCK_KEY=<base64 32 bytes> node tools/private-add.js <folder>
// The folder holds catalog.json ({ tops, pants, accessories: [kinds] } in the js/outfits.js
// shape, file names in bodies/long/hoodDown/src/shoes) plus those PNGs. Ids are made the same
// way as private-seal.js (a keyed hash of the file name). A kind already in the catalogue is
// replaced by the one in the folder. Keep the folder out of git.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
const dir = process.argv[2];
if (key.length !== 32 || !dir) { console.error('usage: GOOD_LOCK_KEY=... node tools/private-add.js <folder>'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'api', '_private');
const seal = (buf) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([c.update(buf), c.final()]);
  return JSON.stringify({ iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') });
};
const unseal = (file) => {
  const { iv, tag, data } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]);
};
let n = 0;
const ref = (name) => {
  const id = crypto.createHmac('sha256', key).update('private:' + name).digest('hex').slice(0, 16);
  fs.writeFileSync(path.join(OUT, `${id}.enc`), seal(fs.readFileSync(path.join(dir, name)))); n++;
  return `api/outfit?id=${id}`;
};
const cat = JSON.parse(unseal(path.join(OUT, 'index.enc')).toString('utf8'));
const add = JSON.parse(fs.readFileSync(path.join(dir, 'catalog.json'), 'utf8'));
for (const part of ['tops', 'pants', 'accessories']) {
  for (const k of add[part] || []) {
    k.locked = true;
    for (const c of k.colors) {
      for (const set of ['bodies', 'long', 'hoodDown']) if (c[set]) for (const b of Object.keys(c[set])) c[set][b] = ref(c[set][b]);
      if (c.src) c.src = ref(c.src);
      if (c.shoes) for (const s of Object.keys(c.shoes)) c.shoes[s] = ref(c.shoes[s]);
    }
    cat[part] = [...(cat[part] || []).filter((o) => o.id !== k.id), k];
  }
}
fs.writeFileSync(path.join(OUT, 'index.enc'), seal(Buffer.from(JSON.stringify(cat))));
console.log(`added ${n} files; the catalogue has ${['tops', 'pants', 'accessories'].map((p) => `${(cat[p] || []).length} ${p}`).join(', ')}`);
