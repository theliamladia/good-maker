// Vercel serverless function: the GOOD® CRATE.
//   GET  /api/crate                     -> { price, refund, goldOdds, items: [{ id, name, color, tier, pct }] }
//   POST /api/crate { action: 'open' }  -> { roll: { id, item, serial, gold, dup }, coins }
//   POST /api/crate { action: 'reset' } -> owner only: clears the owner's pulls and every serial counter (testing)
// Signed in only. Opening costs 5 GOOD® COINS; the roll happens here, never on
// the page. Every roll is serialized per item (GD-001, GD-002, ...) and added to
// the account's inventory (user:<uid>:inv). A piece you already had refunds 2.
// Owning at least one serialized copy unlocks that piece in THE MAKER.
const crypto = require('crypto');
const { redis, configured, overLimit, parseBody } = require('./_redis');
const { currentUser, saveUser, isOwner } = require('./_account');
const { ITEMS, ODDS, GOLD_ODDS, PRICE, REFUND, table } = require('./_crate');

// Weighted pick in hundredths of a percent, from a cryptographic RNG.
function pick(odds) {
  const total = odds.reduce((a, [, p]) => a + Math.round(p * 100), 0);
  let r = crypto.randomInt(0, total);
  for (const [id, p] of odds) { r -= Math.round(p * 100); if (r < 0) return id; }
  return odds[odds.length - 1][0];
}
const serialOf = (n) => `GD-${String(n).padStart(3, '0')}`;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') { res.status(200).json({ price: PRICE, refund: REFUND, goldOdds: GOLD_ODDS, items: table() }); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  try {
    const me = await currentUser(req);
    if (!me) { res.status(401).json({ error: 'signed_out' }); return; }
    const action = parseBody(req).action;
    if (action === 'reset' && isOwner(me)) {
      // Keeps the owner's GD-999 set; clears every other pull and resets all serial counters.
      const keep = ((await redis('LRANGE', `user:${me.uid}:inv`, 0, -1)) || []).filter((r) => JSON.parse(r).serial === 'GD-999');
      await redis('DEL', `user:${me.uid}:inv`, `user:${me.uid}:owned`, ...Object.keys(ITEMS).map((id) => `crate:serial:${id}`));
      for (const r of keep.reverse()) { await redis('LPUSH', `user:${me.uid}:inv`, r); await redis('SADD', `user:${me.uid}:owned`, JSON.parse(r).item); }
      res.status(200).json({ ok: true }); return;
    }
    if (action !== 'open') { res.status(400).json({ error: 'action' }); return; }
    if (await overLimit(req, `crate:${me.uid}`, 20)) { res.status(429).json({ error: 'slow_down' }); return; }
    // One open at a time per account, so coins can't be spent twice.
    const lock = `crate:lock:${me.uid}`;
    if (!(await redis('SET', lock, 1, 'EX', 10, 'NX'))) { res.status(409).json({ error: 'busy' }); return; }
    try {
      const raw = await redis('GET', `user:${me.uid}`);
      const user = raw ? JSON.parse(raw) : null;
      if (!user) { res.status(401).json({ error: 'signed_out' }); return; }
      if ((user.coins || 0) < PRICE) { res.status(402).json({ error: 'coins', coins: user.coins || 0, price: PRICE }); return; }
      let id = pick(ODDS);
      const gold = id === 'GOLD';
      if (gold) id = pick(GOLD_ODDS);
      const n = await redis('INCR', `crate:serial:${id}`);
      const fresh = await redis('SADD', `user:${user.uid}:owned`, id);
      const dup = !fresh;
      const entry = { id: crypto.randomBytes(6).toString('base64url'), item: id, serial: serialOf(n), at: new Date().toISOString() };
      await redis('LPUSH', `user:${user.uid}:inv`, JSON.stringify(entry));
      user.coins = (user.coins || 0) - PRICE + (dup ? REFUND : 0);
      await saveUser(user);
      const it = ITEMS[id];
      res.status(200).json({ roll: { ...entry, name: it.name, color: it.color, tier: it.tier, gold, dup, refund: dup ? REFUND : 0 }, coins: user.coins });
    } finally {
      await redis('DEL', lock);
    }
  } catch (err) {
    res.status(502).json({ error: 'storage' });
  }
};
