// Vercel serverless function: the signed-in account.
//   GET  /api/me                                  -> { user: { name, coins, hasSkin }, wardrobe: [...] } or { user: null }
//   GET  /api/me?skin=1                           -> the home skin (image/png)
//   POST /api/me { action: 'name', name }
//   POST /api/me { action: 'skin', png }          -> png = base64 of a 64x64 / 64x32 PNG
//   POST /api/me { action: 'save', look }         -> adds a look to the wardrobe; the first new fit each day earns +10 GOOD® COINS
//   POST /api/me { action: 'remove', id }
//   POST /api/me { action: 'delete' }             -> deletes the account and everything in it
// Looks are recipes of catalogue ids (like the address bar), never pictures.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { redis, configured, overLimit, parseBody } = require('./_redis');
const { sha, currentUser, endSession, saveUser } = require('./_account');

const COINS_PER_SAVE = 10;
const MAX_LOOKS = 60;
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/outfits.js'), 'utf8'), { window: win });
const TOPS = new Set(); const BOTTOMS = new Map();
for (const k of win.OUTFITS) for (const c of k.colors || [k]) if (!(k.locked || c.locked)) TOPS.add(c.id);
for (const k of win.PANTS) for (const c of k.colors || [k]) BOTTOMS.set(c.id, Object.keys(c.shoes || k.shoes || {}));

function cleanLook(L) {
  L = L || {};
  const out = {};
  if (L.top) { if (!TOPS.has(String(L.top))) return null; out.top = String(L.top); }
  if (L.bottom) { if (!BOTTOMS.has(String(L.bottom))) return null; out.bottom = String(L.bottom); }
  if (!out.top && !out.bottom) return null;
  if (out.bottom && BOTTOMS.get(out.bottom).includes(L.shoe)) out.shoe = L.shoe;
  if (L.feet === 'bare') out.feet = 'bare';
  if (['short', 'long'].includes(L.sleeve)) out.sleeve = L.sleeve;
  if (['classic', 'slim'].includes(L.body)) out.body = L.body;
  if (L.tuck === 'out') out.tuck = 'out';
  if (L.boxer === 'tartan') out.boxer = 'tartan';
  return out;
}
const lookKey = (L) => JSON.stringify(Object.keys(L).sort().map((k) => [k, L[k]]));
const isPng = (b) => b.length > 24 && b.length < 40000 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(16) === 64 && [32, 64].includes(b.readUInt32BE(20));

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  try {
    const user = await currentUser(req);
    if (req.method === 'GET') {
      if (req.query && req.query.skin) {
        const b64 = user && await redis('GET', `user:${user.uid}:skin`);
        if (!b64) { res.status(404).json({ error: 'no_skin' }); return; }
        res.setHeader('Content-Type', 'image/png');
        res.status(200).send(Buffer.from(b64, 'base64'));
        return;
      }
      if (!user) { res.status(200).json({ user: null }); return; }
      const rows = (await redis('LRANGE', `user:${user.uid}:wardrobe`, 0, MAX_LOOKS - 1)) || [];
      const hasSkin = !!(await redis('EXISTS', `user:${user.uid}:skin`));
      res.status(200).json({ user: { name: user.name, coins: user.coins || 0, hasSkin }, wardrobe: rows.map((r) => JSON.parse(r)) });
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
    if (!user) { res.status(401).json({ error: 'signed_out' }); return; }
    const body = parseBody(req);
    if (await overLimit(req, `me:${user.uid}`, 30)) { res.status(429).json({ error: 'slow_down' }); return; }

    if (body.action === 'name') {
      const name = String(body.name || '').replace(/[^A-Za-z0-9_ .-]/g, '').trim().slice(0, 16).toUpperCase();
      if (name.length < 2) { res.status(400).json({ error: 'name' }); return; }
      user.name = name; await saveUser(user);
      res.status(200).json({ ok: true, name }); return;
    }
    if (body.action === 'skin') {
      const buf = Buffer.from(String(body.png || ''), 'base64');
      if (!isPng(buf)) { res.status(400).json({ error: 'skin' }); return; }
      await redis('SET', `user:${user.uid}:skin`, buf.toString('base64'));
      res.status(200).json({ ok: true }); return;
    }
    if (body.action === 'save') {
      const look = cleanLook(body.look);
      if (!look) { res.status(400).json({ error: 'look' }); return; }
      const key = `user:${user.uid}:wardrobe`;
      const rows = ((await redis('LRANGE', key, 0, MAX_LOOKS - 1)) || []).map((r) => JSON.parse(r));
      if (rows.some((r) => lookKey(r.look) === lookKey(look))) { res.status(200).json({ ok: true, duplicate: true, coins: user.coins || 0 }); return; }
      if (rows.length >= MAX_LOOKS) { res.status(400).json({ error: 'full' }); return; }
      const item = { id: crypto.randomBytes(6).toString('base64url'), look, at: new Date().toISOString() };
      await redis('LPUSH', key, JSON.stringify(item));
      // Coins are earned once per distinct look ever saved, so delete-and-resave can't farm them.
      // Up to 10 GOOD® COINS a day (UTC): the first new fit saved each day earns them.
      const fresh = await redis('SADD', `user:${user.uid}:earned`, sha(lookKey(look)));
      const today = new Date().toISOString().slice(0, 10);
      const earned = fresh ? await redis('SET', `user:${user.uid}:coins:${today}`, 1, 'EX', 172800, 'NX') : null;
      if (earned) { user.coins = (user.coins || 0) + COINS_PER_SAVE; await saveUser(user); }
      res.status(200).json({ ok: true, item, coins: user.coins || 0, earned: earned ? COINS_PER_SAVE : 0, capped: !!(fresh && !earned) }); return;
    }
    if (body.action === 'remove') {
      const key = `user:${user.uid}:wardrobe`;
      const rows = (await redis('LRANGE', key, 0, MAX_LOOKS - 1)) || [];
      const hit = rows.find((r) => JSON.parse(r).id === body.id);
      if (hit) await redis('LREM', key, 1, hit);
      res.status(200).json({ ok: true }); return;
    }
    if (body.action === 'delete') {
      await redis('DEL', `user:${user.uid}`, `user:${user.uid}:skin`, `user:${user.uid}:wardrobe`, `user:${user.uid}:earned`, `user:email:${sha(user.email)}`);
      await endSession(req, res);
      res.status(200).json({ ok: true }); return;
    }
    res.status(400).json({ error: 'action' });
  } catch (err) {
    res.status(502).json({ error: 'storage' });
  }
};
