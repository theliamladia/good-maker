// Vercel serverless function: public GOOD® profiles (/profiles/<slug>, see vercel.json).
//   GET /api/profile?name=<slug>          -> { name, admin, tags, coins, since, achievements, inventory, wardrobe, hasSkin }
//   GET /api/profile?name=<slug>&skin=1   -> the home skin (image/png), to draw the wardrobe on
//   POST /api/profile { action: 'like', name, fit } -> toggles your like on one of their fits: { likes, liked }
// Likes: likes:<uid> (hash fit id -> count, kept equal to the set's size, shown to everyone) and likes:<uid>:<fit> (set of
// the uids who liked it, never shown); liked:<uid> = what that account has liked (owner:fit).
// Public: the GOOD® name, GOOD® COINS, member since, earned achievements,
// serialized pulls and saved fits (with their names). Never the email.
const { redis, configured, overLimit, parseBody } = require('./_redis');
const ACH = require('./_achievements');
const { isOwner, tagsOf, currentUser } = require('./_account');
const { forLooks } = require('./_private');
const HOUSE = require('./_house');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  if (req.method === 'POST') { await like(req, res); return; }
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
    const wardrobe = ((await redis('LRANGE', `user:${uid}:wardrobe`, 0, 59)) || []).map((r) => { const { id, look, title } = JSON.parse(r); return { id, look, title }; });
    const pieces = forLooks(wardrobe.map((w) => w.look));   // private pieces in these fits: shown, never wearable
    const house = HOUSE.forLooks(wardrobe.map((w) => w.look));   // and HOUSE® one-of-ones
    pieces.tops = [...(pieces.tops || []), ...house.tops]; pieces.pants = [...(pieces.pants || []), ...house.pants];
    const hasSkin = !!(await redis('EXISTS', `user:${uid}:skin`));
    // Likes on each fit (everyone sees the count; you see which ones you liked).
    const counts = pairs((await redis('HGETALL', `likes:${uid}`)) || []);
    const viewer = await currentUser(req).catch(() => null);
    const mine = new Set(viewer ? ((await redis('SMEMBERS', `liked:${viewer.uid}`)) || []) : []);
    for (const w of wardrobe) { w.likes = Math.max(0, +counts[w.id] || 0); if (mine.has(`${uid}:${w.id}`)) w.liked = true; }
    res.status(200).json({ name: user.name, admin: isOwner(user), tags: tagsOf(user.name), coins: user.coins || 0, since: (user.created || '').slice(0, 10), achievements, inventory, wardrobe, pieces, hasSkin });
  } catch {
    res.status(502).json({ error: 'storage' });
  }
};

// HGETALL comes back as [field, value, field, value, ...] (or an object from some clients).
function pairs(r) {
  if (!Array.isArray(r)) return r || {};
  const o = {}; for (let i = 0; i + 1 < r.length; i += 2) o[r[i]] = r[i + 1]; return o;
}

// Like or unlike someone else's saved fit. Signed in only; not your own fits; rate limited.
async function like(req, res) {
  try {
    const me = await currentUser(req);
    if (!me) { res.status(401).json({ error: 'signed_out' }); return; }
    if (await overLimit(req, 'like', 60)) { res.status(429).json({ error: 'slow_down' }); return; }
    const body = parseBody(req) || {};
    const slug = String(body.name || '').toLowerCase(), fit = String(body.fit || '');
    if (body.action !== 'like' || !/^[a-z0-9_-]{2,20}$/.test(slug) || !/^[A-Za-z0-9_-]{4,24}$/.test(fit)) { res.status(400).json({ error: 'bad_request' }); return; }
    const uid = await redis('GET', `profile:${slug}`);
    if (!uid) { res.status(404).json({ error: 'not_found' }); return; }
    if (uid === me.uid) { res.status(400).json({ error: 'own_fit' }); return; }
    const rows = (await redis('LRANGE', `user:${uid}:wardrobe`, 0, 59)) || [];
    if (!rows.some((r) => { try { return JSON.parse(r).id === fit; } catch { return false; } })) { res.status(404).json({ error: 'not_found' }); return; }
    const set = `likes:${uid}:${fit}`, tag = `${uid}:${fit}`;
    let liked;
    if (+(await redis('SADD', set, me.uid)) === 1) { await redis('SADD', `liked:${me.uid}`, tag); liked = true; }
    else { await redis('SREM', set, me.uid); await redis('SREM', `liked:${me.uid}`, tag); liked = false; }
    const likes = Math.max(0, +(await redis('SCARD', set)) || 0);
    await redis('HSET', `likes:${uid}`, fit, likes);   // the count always matches the set
    res.status(200).json({ likes, liked });
  } catch {
    res.status(502).json({ error: 'storage' });
  }
}
