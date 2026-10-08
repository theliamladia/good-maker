// Vercel serverless function: POST /api/ubiquity  { password, file? }
// UBIQUITY® is locked. Its research lives in api/_ubiquity/ encrypted
// (AES-256-GCM, key = scrypt of the password; see tools/ubiquity-seal.js).
// The password is not stored anywhere: the key is derived from what was typed,
// and a wrong password fails to decrypt -> 401 after a short delay to slow
// guessing. Without file: returns the manifest (text + file list). With file
// (an id from the manifest): returns that file as base64.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = path.join(__dirname, '_ubiquity');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let cfg = null;
const keys = new Map(); // sha256(password) -> key, so each image isn't another scrypt

function keyFor(pw) {
  cfg ||= JSON.parse(fs.readFileSync(path.join(DIR, 'salt.json'), 'utf8'));
  const h = crypto.createHash('sha256').update(pw).digest('hex');
  if (!keys.has(h)) keys.set(h, crypto.scryptSync(pw, Buffer.from(cfg.salt, 'base64'), 32, { N: cfg.N, r: cfg.r, p: cfg.p, maxmem: cfg.maxmem }));
  return keys.get(h);
}
function open(name, key) {
  const box = JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8'));
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(box.iv, 'base64'));
  d.setAuthTag(Buffer.from(box.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(box.data, 'base64')), d.final()]);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const pw = String((body && body.password) || '');
  if (!pw || pw.length > 200) { await sleep(600); res.status(401).json({ error: 'locked' }); return; }
  let key, manifest;
  try {
    key = keyFor(pw);
    manifest = JSON.parse(open('index.enc', key).toString('utf8'));
  } catch {
    keys.clear();
    await sleep(700);
    res.status(401).json({ error: 'locked' });
    return;
  }
  if (!body.file) { res.status(200).json(manifest); return; }
  const f = manifest.files.find((x) => x.id === body.file);
  if (!f) { res.status(404).json({ error: 'file' }); return; }
  res.status(200).json({ type: f.type, name: f.name, data: open(`${f.id}.enc`, key).toString('base64') });
};
