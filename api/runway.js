// Vercel serverless function: POST /api/runway  { password }
// RUNWAY® looks are locked. The passwords live only in environment variables
// (never in the repo or the page): RUNWAY_PASSWORD gives full access,
// RUNWAY_PREVIEW_PASSWORD gives view-only preview mode. The look PNGs live
// only in environment variables too (base64). A correct password returns the
// looks XOR-scrambled with a fresh random key each, like the old Founders
// preview; a wrong one returns a bare 401 after a short delay to slow guessing.

const crypto = require('crypto');

const LOOKS = [
  { id: 'look-1', name: 'LOOK 1®', env: ['RUNWAY_LOOK1_PNG_B64', 'FOUNDERS_PNG_B64'] },
  { id: 'look-2', name: 'LOOK 2®', env: ['RUNWAY_LOOK2_PNG_B64'] },
  { id: 'look-3', name: 'LOOK 3®', env: ['RUNWAY_LOOK3_PNG_B64'] },
];

const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function scramble(png) {
  const key = crypto.randomBytes(32);
  const data = Buffer.alloc(png.length);
  for (let i = 0; i < png.length; i++) data[i] = png[i] ^ key[i % key.length];
  return { k: key.toString('base64'), d: data.toString('base64') };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  const secret = process.env.RUNWAY_PASSWORD;
  if (!secret) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const given = String((body && body.password) || '');

  // Constant-time comparisons of fixed-length digests.
  const previewSecret = process.env.RUNWAY_PREVIEW_PASSWORD;
  const full = crypto.timingSafeEqual(digest(given), digest(secret));
  const preview = !full && !!previewSecret && crypto.timingSafeEqual(digest(given), digest(previewSecret));
  if (!full && !preview) {
    await sleep(900);
    res.status(401).json({ error: 'denied' });
    return;
  }

  const looks = [];
  for (const look of LOOKS) {
    const b64 = look.env.map((n) => process.env[n]).find(Boolean);
    if (b64) looks.push({ id: look.id, name: look.name, ...scramble(Buffer.from(b64, 'base64')) });
  }
  if (!looks.length) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }
  res.status(200).json({ looks, preview });
};
