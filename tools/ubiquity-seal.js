// Seal the UBIQUITY® research folder for the locked page.
//   UBIQUITY_PASSWORD=... node tools/ubiquity-seal.js <folder>
// The folder holds content.json plus every file it names (images, textures,
// source). Each file is encrypted with AES-256-GCM under a key derived from
// the password (scrypt, random salt) and written to api/_ubiquity/ as f<n>.enc;
// the manifest (content + file list) is index.enc. The password is never
// stored: api/ubiquity.js derives the key from what the visitor types, and a
// wrong password simply fails to decrypt.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pw = process.env.UBIQUITY_PASSWORD;
const dir = process.argv[2];
if (!pw || !dir) { console.error('usage: UBIQUITY_PASSWORD=... node tools/ubiquity-seal.js <folder>'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'api', '_ubiquity');
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(pw, salt, 32, SCRYPT);
const seal = (buf) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([c.update(buf), c.final()]);
  return JSON.stringify({ iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') });
};
const TYPES = { '.png': 'image/png', '.webp': 'image/webp', '.py': 'text/plain', '.js': 'text/plain', '.json': 'application/json', '.md': 'text/plain' };

const content = JSON.parse(fs.readFileSync(path.join(dir, 'content.json'), 'utf8'));
const names = [...new Set(content.sections.flatMap((s) => [...(s.img || []), ...(s.files || []), ...(s.code || [])]))];
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const files = names.map((name, i) => {
  const id = `f${i}`;
  fs.writeFileSync(path.join(OUT, `${id}.enc`), seal(fs.readFileSync(path.join(dir, name))));
  return { id, name, type: TYPES[path.extname(name)] || 'application/octet-stream' };
});
fs.writeFileSync(path.join(OUT, 'index.enc'), seal(Buffer.from(JSON.stringify({ content, files }))));
fs.writeFileSync(path.join(OUT, 'salt.json'), JSON.stringify({ salt: salt.toString('base64'), ...SCRYPT }));
console.log(`sealed ${files.length} files into api/_ubiquity`);
