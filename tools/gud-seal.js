// Seal the GUD™ early views for /gud.
//   GUD_PASSWORD=... node tools/gud-seal.js <folder>
// <folder> holds content.json ({ pieces: [{ line, name, img }] }) and the images
// it names. Same scheme as tools/ubiquity-seal.js: AES-256-GCM under a scrypt
// key from the password, written to api/_gud/. The password is never stored;
// api/ubiquity.js (vault "gud") derives the key from what the visitor types.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pw = process.env.GUD_PASSWORD;
const dir = process.argv[2];
if (!pw || !dir) { console.error('usage: GUD_PASSWORD=... node tools/gud-seal.js <folder>'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'api', '_gud');
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(pw, salt, 32, SCRYPT);
const seal = (buf) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([c.update(buf), c.final()]);
  return JSON.stringify({ iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') });
};
const content = JSON.parse(fs.readFileSync(path.join(dir, 'content.json'), 'utf8'));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const files = content.pieces.map((p, i) => {
  const id = `f${i}`;
  fs.writeFileSync(path.join(OUT, `${id}.enc`), seal(fs.readFileSync(path.join(dir, p.img))));
  return { id, line: p.line, name: p.name, type: 'image/png' };
});
fs.writeFileSync(path.join(OUT, 'index.enc'), seal(Buffer.from(JSON.stringify({ files }))));
fs.writeFileSync(path.join(OUT, 'salt.json'), JSON.stringify({ salt: salt.toString('base64'), ...SCRYPT }));
console.log(`sealed ${files.length} views into api/_gud`);
