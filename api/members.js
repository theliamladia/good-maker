// Vercel serverless function: GET /api/members -> every public GOOD® profile.
//   [{ name, slug, admin, coins, achievements, since, hasSkin }]
// Never emails. Heads are drawn on the page from /api/profile?name=<slug>&skin=1.
const { redis, configured } = require('./_redis');
const { isOwner, claimProfile } = require('./_account');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  try {
    // Every account (user:<uid>, not user:<uid>:...), each with a profile URL claimed if it doesn't have one yet.
    const keys = [];
    let cursor = '0';
    do { const [next, batch] = await redis('SCAN', cursor, 'MATCH', 'user:*', 'COUNT', 500); cursor = String(next); keys.push(...batch.filter((k) => k.split(':').length === 2)); } while (cursor !== '0');
    const members = [];
    for (const k of keys) {
      const raw = await redis('GET', k);
      if (!raw) continue;
      let u; try { u = JSON.parse(raw); } catch { continue; }
      if (!u || !u.uid || !u.name) continue;
      const slug = await claimProfile(u);
      if (!slug) continue;
      members.push({
        name: u.name, slug, admin: isOwner(u), coins: u.coins || 0,
        achievements: Math.max(1, (await redis('SCARD', `user:${u.uid}:ach`)) || 0), since: (u.created || '').slice(0, 10),
        hasSkin: !!(await redis('EXISTS', `user:${u.uid}:skin`)),
      });
    }
    members.sort((a, b) => b.admin - a.admin || a.name.localeCompare(b.name));
    res.status(200).json({ members });
  } catch {
    res.status(502).json({ error: 'storage' });
  }
};
