// GOOD® STANDS (served at /api/stand, via api/skin.js): turn a fit from MAKER® into a code the GoodStands plugin
// can wear in Minecraft. POST (signed in) sends the finished skin PNG; it is
// signed through MineSkin so Minecraft will render it, and stored under a
// short code. GET ?code= returns the signed texture for the plugin.
const crypto = require('crypto');
const { redis, configured, overLimit, parseBody } = require('./_redis');
const { currentUser } = require('./_account');

const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-Z2-9]{6}$/;
const newCode = () => Array.from(crypto.randomBytes(6), (b) => ABC[b % ABC.length]).join('');

// A 64×64 PNG and nothing else.
function skinPng(dataUrl) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length < 33 || buf.length > 64 * 1024) return null;
  if (buf.toString('hex', 0, 8) !== '89504e470d0a1a0a' || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  if (buf.readUInt32BE(16) !== 64 || buf.readUInt32BE(20) !== 64) return null;
  return buf;
}

async function sign(png, slim, retry = true) {
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'good.png');
  form.append('variant', slim ? 'slim' : 'classic');
  form.append('visibility', 'unlisted');
  form.append('name', 'GOOD DESIGN');
  const headers = { 'User-Agent': 'GoodDesign/1.0 (+https://good.leems.me)' };
  if (process.env.MINESKIN_KEY) headers.Authorization = `Bearer ${process.env.MINESKIN_KEY}`;
  const r = await fetch('https://api.mineskin.org/v2/generate', { method: 'POST', headers, body: form });
  const j = await r.json().catch(() => ({}));
  // MineSkin spaces out anonymous uploads: wait out a short delay once.
  const wait = j.delayInfo && j.delayInfo.millis;
  if (r.status === 429 && retry && wait && wait <= 6000) {
    await new Promise((ok) => setTimeout(ok, wait + 250));
    return sign(png, slim, false);
  }
  const data = j.skin && j.skin.texture && j.skin.texture.data;
  if (!r.ok || !data || !data.value || !data.signature) {
    const e = new Error('mineskin'); e.status = r.status; throw e;
  }
  return { value: data.value, signature: data.signature };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'unavailable' }); return; }
  try {
    if (req.method === 'GET') {
      const code = String((req.query && req.query.code) || '').trim().toUpperCase();
      if (!CODE_RE.test(code)) { res.status(400).json({ error: 'bad_code' }); return; }
      if (await overLimit(req, 'stand-get', 60)) { res.status(429).json({ error: 'slow_down' }); return; }
      const raw = await redis('GET', `stand:${code}`);
      if (!raw) { res.status(404).json({ error: 'not_found' }); return; }
      const s = JSON.parse(raw);
      res.status(200).json({ code, name: s.name, slim: s.slim, value: s.value, signature: s.signature });
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
    const me = await currentUser(req);
    if (!me) { res.status(401).json({ error: 'signed_out' }); return; }
    if (await overLimit(req, 'stand-post', 5)) { res.status(429).json({ error: 'slow_down' }); return; }
    const body = parseBody(req);
    const png = skinPng(body.png);
    if (!png) { res.status(400).json({ error: 'bad_png' }); return; }
    const slim = !!body.slim;
    const name = String(body.name || '').replace(/[^\x20-\x7E®™ⓤ]/g, '').trim().slice(0, 48) || 'GOOD®';
    // Same skin, same code: no second MineSkin upload.
    const hash = crypto.createHash('sha256').update(png).update(slim ? 's' : 'c').digest('hex');
    const known = await redis('GET', `stand:hash:${hash}`);
    if (known) { res.status(200).json({ code: known }); return; }
    const tex = await sign(png, slim);
    let code = newCode();
    while (!(await redis('SET', `stand:${code}`, JSON.stringify({ ...tex, slim, name, uid: me.uid, t: Date.now() }), 'NX'))) code = newCode();
    await redis('SET', `stand:hash:${hash}`, code);
    res.status(200).json({ code });
  } catch (err) {
    res.status(err.message === 'mineskin' ? 502 : 500).json({ error: err.message === 'mineskin' ? 'mineskin' : 'server' });
  }
};
