// Vercel serverless function: GET /api/outfit?id=<id>
// Serves preview-only (locked) outfits. Their PNGs are never in the (public)
// repo or served as images: each lives in an environment variable (base64 PNG)
// and is sent XOR-scrambled with a fresh random key per request, so there's no
// PNG URL to open and no image in the network log. The page unscrambles it
// straight into the 3D preview and offers no download. This deters copying;
// it can't make extraction impossible, since the browser must draw the pixels.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LOCKED = {
  'goodie-im-sowwy-classic': 'GOODIE_IM_SOWWY_CLASSIC_PNG_B64',
  'goodie-im-sowwy-slim': 'GOODIE_IM_SOWWY_SLIM_PNG_B64',
  'goodie-black-chrome-classic': 'GOODIE_BLACK_CHROME_CLASSIC_PNG_B64',
  'goodie-black-chrome-slim': 'GOODIE_BLACK_CHROME_SLIM_PNG_B64',
};

// Newer locked pieces ship as AES-256-GCM ciphertext in api/_locked/<id>.enc
// (sealed by tools/lock-seal.js); the key is the GOOD_LOCK_KEY env variable.
// Any id with a sealed file in api/_locked is served from it.
const SEALED = { has: (id) => /^[a-z0-9-]+$/.test(id) && fs.existsSync(path.join(__dirname, '_locked', `${id}.enc`)) };
function unseal(id) {
  const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
  if (key.length !== 32) return null;
  const { iv, tag, data } = JSON.parse(fs.readFileSync(path.join(__dirname, '_locked', `${id}.enc`), 'utf8'));
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]);
}

// Owner-only pieces (tools/private-seal.js): api/_private/<id>.enc and the catalogue,
// index.enc (?private=1). For anyone but the owner's session they answer exactly like
// an unknown id, so nothing shows they exist.
const PRIVATE = { has: (id) => /^[0-9a-f]{16}$/.test(id) && fs.existsSync(path.join(__dirname, '_private', `${id}.enc`)) };
function unsealFile(file) {
  const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
  if (key.length !== 32) return null;
  const { iv, tag, data } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]);
}
async function ownerOnly(req) {
  try { const { currentUser, isOwner } = require('./_account'); return isOwner(await currentUser(req)); } catch { return false; }
}

module.exports = async function handler(req, res) {
  let id = String((req.query && req.query.id) || '');
  res.setHeader('Cache-Control', 'no-store');
  const unknown = () => res.status(404).json({ error: 'unknown_outfit' });
  // Gated drops (api/_drop.js): nothing exists before the drop, except to the owner, who can
  // check it in MAKER® first. ?drop=<name> is its catalogue (?gud=1 for GUD™).
  const { DROPS, isOpen, dropOf } = require('./_drop');
  if (req.query && req.query.gud === '1') id = 'gud-index';
  if (req.query && Object.hasOwn(DROPS, String(req.query.drop))) id = DROPS[String(req.query.drop)].index;
  const drop = dropOf(id);
  if (drop && !isOpen(drop) && !(await ownerOnly(req))) { unknown(); return; }
  if (drop && id === DROPS[drop].index) {
    let buf = null;
    try { buf = unseal(id); } catch { buf = null; }
    if (!buf) { unknown(); return; }
    res.status(200).json(JSON.parse(buf.toString('utf8'))); return;
  }
  const wantsPrivate = req.query && req.query.private === '1';
  if (wantsPrivate || PRIVATE.has(id)) {
    if (!(await ownerOnly(req))) { unknown(); return; }
    let buf = null;
    try { buf = unsealFile(path.join(__dirname, '_private', wantsPrivate ? 'index.enc' : `${id}.enc`)); } catch { buf = null; }
    if (!buf) { unknown(); return; }
    if (wantsPrivate) { res.status(200).json(JSON.parse(buf.toString('utf8'))); return; }
    const key = crypto.randomBytes(32);
    const data = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) data[i] = buf[i] ^ key[i % key.length];
    res.status(200).json({ k: key.toString('base64'), d: data.toString('base64') });
    return;
  }
  const envName = LOCKED[id];
  if (!envName && !SEALED.has(id)) {
    unknown();
    return;
  }
  let png = null;
  try { png = envName ? (process.env[envName] ? Buffer.from(process.env[envName], 'base64') : null) : unseal(id); } catch { png = null; }
  if (!png) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }
  const key = crypto.randomBytes(32);
  const data = Buffer.alloc(png.length);
  for (let i = 0; i < png.length; i++) data[i] = png[i] ^ key[i % key.length];
  res.status(200).json({ k: key.toString('base64'), d: data.toString('base64') });
};
