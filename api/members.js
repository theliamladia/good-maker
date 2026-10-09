// Vercel serverless function: GET /api/members -> every public GOOD® profile.
//   [{ name, slug, admin, coins, achievements, since, hasSkin }]
// Never emails. Heads are drawn on the page from /api/profile?name=<slug>&skin=1.
const { redis, configured } = require('./_redis');
const { isOwner } = require('./_account');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  try {
    const keys = [];
    let cursor = '0';
    do { const [next, batch] = await redis('SCAN', cursor, 'MATCH', 'profile:*', 'COUNT', 200); cursor = String(next); keys.push(...batch); } while (cursor !== '0');
    const members = [];
    for (const k of keys) {
      const uid = await redis('GET', k);
      const raw = uid && await redis('GET', `user:${uid}`);
      if (!raw) continue;
      const u = JSON.parse(raw);
      members.push({
        name: u.name, slug: k.slice('profile:'.length), admin: isOwner(u), coins: u.coins || 0,
        achievements: (await redis('SCARD', `user:${uid}:ach`)) || 0, since: (u.created || '').slice(0, 10),
        hasSkin: !!(await redis('EXISTS', `user:${uid}:skin`)),
      });
    }
    members.sort((a, b) => b.admin - a.admin || a.name.localeCompare(b.name));
    res.status(200).json({ members });
  } catch {
    res.status(502).json({ error: 'storage' });
  }
};
