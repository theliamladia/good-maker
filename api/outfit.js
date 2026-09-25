// Vercel serverless function: GET /api/outfit?id=<id>
// Serves preview-only outfits. Their PNGs are never in the (public) repo or
// served as images: each lives in an environment variable (base64 PNG) and is
// sent XOR-scrambled with a fresh random key per request, so there's no PNG
// URL to open and no image in the network log. The client unscrambles it
// straight into the 3D preview. This deters casual copying; it can't make
// extraction impossible, since the browser must draw the pixels.

const crypto = require('crypto');

const LOCKED = {
  founders: 'FOUNDERS_PNG_B64',
};

module.exports = function handler(req, res) {
  const id = String((req.query && req.query.id) || '');
  const envName = LOCKED[id];
  const b64 = envName && process.env[envName];
  res.setHeader('Cache-Control', 'no-store');
  if (!envName) {
    res.status(404).json({ error: 'unknown_outfit' });
    return;
  }
  if (!b64) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const png = Buffer.from(b64, 'base64');
  const key = crypto.randomBytes(32);
  const data = Buffer.alloc(png.length);
  for (let i = 0; i < png.length; i++) data[i] = png[i] ^ key[i % key.length];

  res.status(200).json({ k: key.toString('base64'), d: data.toString('base64') });
};
