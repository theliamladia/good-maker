// Vercel serverless function: public GOOD® profiles (/profiles/<slug>, see vercel.json).
//   GET /api/profile?name=<slug>          -> { name, since, achievements, inventory, wardrobe, hasSkin }
//   GET /api/profile?name=<slug>&skin=1   -> the home skin (image/png), to draw the wardrobe on
// Public: the GOOD® name, member since, earned achievements, serialized pulls
// and saved fits. Never the email or the coin balance.
const { redis, configured } = require('./_redis');
const ACH = require('./_achievements');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  const slug = String((req.query && req.query.name) || '').toLowerCase();
  if (!/^[a-z0-9_-]{2,20}$/.test(slug)) { res.status(404).json({ error: 'not_found' }); return; }
  try {
    const uid = await redis('GET', `profile:${slug}`);
    const raw = uid && await redis('GET', `user:${uid}`);
    if (!raw) { res.status(404).json({ error: 'not_found' }); return; }
    const user = JSON.parse(raw);
    if (req.query.skin) {
      const b64 = await redis('GET', `user:${uid}:skin`);
      if (!b64) { res.status(404).json({ error: 'no_skin' }); return; }
      res.setHeader('Content-Type', 'image/png'); res.status(200).send(Buffer.from(b64, 'base64')); return;
    }
    const achievements = (await ACH.list(uid)).filter((a) => a.earned).map(({ id, name, desc, icon, pct, at }) => ({ id, name, desc, icon, pct, at }));
    const inventory = ((await redis('LRANGE', `user:${uid}:inv`, 0, -1)) || []).map((r) => { const { item, serial, at } = JSON.parse(r); return { item, serial, at }; });
    const wardrobe = ((await redis('LRANGE', `user:${uid}:wardrobe`, 0, 59)) || []).map((r) => { const { look } = JSON.parse(r); return { look }; });
    const hasSkin = !!(await redis('EXISTS', `user:${uid}:skin`));
    res.status(200).json({ name: user.name, since: (user.created || '').slice(0, 10), achievements, inventory, wardrobe, hasSkin });
  } catch {
    res.status(502).json({ error: 'storage' });
  }
};
