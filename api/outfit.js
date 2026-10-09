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
const SEALED = new Set([
  'shirt-im-sowwy-classic', 'shirt-im-sowwy-slim', 'shirt-im-sowwy-long-classic', 'shirt-im-sowwy-long-slim',
  'shirt-ii-im-sowwy-classic', 'shirt-ii-im-sowwy-slim', 'shirt-ii-im-sowwy-long-classic', 'shirt-ii-im-sowwy-long-slim',
]);
function unseal(id) {
  const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
  if (key.length !== 32) return null;
  const { iv, tag, data } = JSON.parse(fs.readFileSync(path.join(__dirname, '_locked', `${id}.enc`), 'utf8'));
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]);
}

module.exports = function handler(req, res) {
  const id = String((req.query && req.query.id) || '');
  res.setHeader('Cache-Control', 'no-store');
  const envName = LOCKED[id];
  if (!envName && !SEALED.has(id)) {
    res.status(404).json({ error: 'unknown_outfit' });
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
