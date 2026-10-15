// Vercel serverless function: the signed-in account.
//   GET  /api/me                                  -> { user: { name, coins, hasSkin, unlocks }, wardrobe: [...], inventory: [...] } or { user: null }
//   GET  /api/me?skin=1                           -> the home skin (image/png)
//   POST /api/me { action: 'name', name }
//   POST /api/me { action: 'skin', png }          -> png = base64 of a 64x64 / 64x32 PNG
//   POST /api/me { action: 'save', look }         -> adds a look to the wardrobe; the first 2 new fits each day earn +10 GOOD® COINS each
//   POST /api/me { action: 'remove', id }
//   POST /api/me { action: 'delete' }             -> deletes the account and everything in it
//   POST /api/me { action: 'prefs', prefs }       -> THE MAKER settings to start from (fit or none, body, MY SKIN, tone)
//   POST /api/me { action: 'suggest', text }      -> the SUGGESTION BOX
//   GET  /api/me?suggestions=1                    -> owner only: every suggestion, newest first
// Looks are recipes of catalogue ids (like the address bar), never pictures.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { redis, configured, overLimit, parseBody } = require('./_redis');
const { sha, currentUser, endSession, saveUser, unlocksFor, isOwner, slugOf, claimProfile } = require('./_account');
const ACH = require('./_achievements');
const { applySeeds } = require('./_seeds');
const { privateIds } = require('./_private');

const COINS_PER_SAVE = 10;
const SAVES_PER_DAY = 4;
const MAX_LOOKS = 60;
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/outfits.js'), 'utf8'), { window: win });
const TOPS = new Set(); const LOCKED = new Map(); const BOTTOMS = new Map();
for (const k of win.OUTFITS) for (const c of k.colors || [k]) if (k.locked || c.locked) LOCKED.set(c.id, k.id); else TOPS.add(c.id);
for (const k of win.PANTS) for (const c of k.colors || [k]) { if (k.locked || c.locked) LOCKED.set(c.id, k.id); BOTTOMS.set(c.id, Object.keys(c.shoes || k.shoes || {})); }
const ACCS = new Set();   // ACCESSORIES: all locked until owned
for (const k of win.ACCESSORIES || []) for (const c of k.colors || [k]) { ACCS.add(c.id); if (k.locked || c.locked) LOCKED.set(c.id, k.id); }

// Locked tops only for accounts that own them (by colour id or kind id).
function cleanLook(L, unlocks = [], owner = false) {
  L = L || {};
  const out = {};
  const priv = owner ? privateIds() : null;   // the owner's own pieces (api/_private.js)
  const owns = (id) => LOCKED.has(id) && (unlocks.includes(id) || unlocks.includes(LOCKED.get(id)));
  if (L.top) { if (!TOPS.has(String(L.top)) && !owns(String(L.top)) && !(priv && priv.tops.has(String(L.top)))) return null; out.top = String(L.top); }
  if (L.bottom) {
    const b = String(L.bottom), mine = priv && priv.bottoms.has(b);
    if (!mine && (!BOTTOMS.has(b) || (LOCKED.has(b) && !owns(b)))) return null;
    out.bottom = b;
  }
  if (!out.top && !out.bottom) return null;
  if (out.bottom && (BOTTOMS.get(out.bottom) || priv.bottoms.get(out.bottom)).includes(L.shoe)) out.shoe = L.shoe;
  if (L.feet === 'bare') out.feet = 'bare';
  if (['short', 'long'].includes(L.sleeve)) out.sleeve = L.sleeve;
  if (['classic', 'slim'].includes(L.body)) out.body = L.body;
  if (L.tuck === 'out') out.tuck = 'out';
  if (L.boxer === 'tartan') out.boxer = 'tartan';
  if (L.acc) { const a = String(L.acc); if ((ACCS.has(a) && (!LOCKED.has(a) || owns(a))) || (priv && priv.accs.has(a))) out.acc = a; }
  const ft = cleanFt(L.ft);
  if (ft) out.ft = ft;
  return out;
}
// FINE TUNING saved with a fit: hair rows, hat layer, MY SKIN, tone, erased pixels (64×64 bitmap, base64).
function cleanFt(F) {
  if (!F || typeof F !== 'object') return null;
  const out = {};
  if (Number.isInteger(F.hair) && F.hair >= 0 && F.hair <= 12) out.hair = F.hair;
  if (['keep', 'auto', 'none'].includes(F.hw)) out.hw = F.hw;
  if (typeof F.ks === 'boolean') out.ks = F.ks;
  if (Array.isArray(F.tone) && F.tone.length === 3 && F.tone.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) out.tone = F.tone;
  if (typeof F.e === 'string' && F.e.length <= 700 && /^[A-Za-z0-9+/]+=*$/.test(F.e) && Buffer.from(F.e, 'base64').length === 512) out.e = F.e;
  return Object.keys(out).length ? out : null;
}
// THE MAKER preferences: a look recipe that may be empty (a blank canvas), plus body, MY SKIN and tone.
function cleanPrefs(P, unlocks, owner = false) {
  P = P || {};
  const out = {};
  const L = P.look || {};
  const look = (L.top || L.bottom) ? cleanLook(L, unlocks, owner) : {};
  if (look) { if (L.feet === 'bare') look.feet = 'bare'; out.look = look; }
  if (['classic', 'slim'].includes(P.body)) out.body = P.body;
  if (typeof P.keepSkin === 'boolean') out.keepSkin = P.keepSkin;
  if (Array.isArray(P.tone) && P.tone.length === 3 && P.tone.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) out.tone = P.tone;
  return out;
}
// Today's GOOD® COINS saves left, and when the UTC day resets.
async function dailyOf(uid) {
  const now = new Date();
  const used = +(await redis('GET', `user:${uid}:coins2:${now.toISOString().slice(0, 10)}`)) || 0;
  const reset = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return { left: Math.max(0, SAVES_PER_DAY - used), per: SAVES_PER_DAY, coins: COINS_PER_SAVE, resetsAt: new Date(reset).toISOString() };
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
      if (req.query && req.query.suggestions) {
        if (!isOwner(user)) { res.status(403).json({ error: 'owner_only' }); return; }
        const rows = (await redis('LRANGE', 'suggestions', 0, 499)) || [];
        res.status(200).json({ suggestions: rows.map((r) => JSON.parse(r)) }); return;
      }
      // One-time account set-ups (api/_seeds.js); re-read in case this account was one of them.
      await applySeeds();
      { const raw = await redis('GET', `user:${user.uid}`); if (raw) Object.assign(user, JSON.parse(raw)); }
      // One-time owner set-up, on the owner's next visit: take back the 1000-coin grant
      // if it was applied, and add every GOOD® CRATE piece at serial GD-999 (outside
      // the normal serial counters, so GD-001 onwards stay attainable).
      if (isOwner(user) && await redis('SET', 'grant:owner:gd999', 1, 'NX')) {
        if (await redis('GET', 'grant:owner:1000:a')) { user.coins = Math.max(0, (user.coins || 0) - 1000); await saveUser(user); }
        const { ITEMS } = require('./_crate');
        for (const item of Object.keys(ITEMS)) {
          await redis('LPUSH', `user:${user.uid}:inv`, JSON.stringify({ id: crypto.randomBytes(6).toString('base64url'), item, serial: 'GD-999', at: new Date().toISOString() }));
          await redis('SADD', `user:${user.uid}:owned`, item);
        }
      }
      const rows = (await redis('LRANGE', `user:${user.uid}:wardrobe`, 0, MAX_LOOKS - 1)) || [];
      const hasSkin = !!(await redis('EXISTS', `user:${user.uid}:skin`));
      const inv = ((await redis('LRANGE', `user:${user.uid}:inv`, 0, -1)) || []).map((r) => JSON.parse(r));
      await ACH.touch(user.uid);
      const achievements = await ACH.list(user.uid);
      const profile = await claimProfile(user);
      res.status(200).json({ user: { name: user.name, coins: user.coins || 0, hasSkin, unlocks: await unlocksFor(user), owner: isOwner(user) || undefined, profile, prefs: user.prefs || null, daily: await dailyOf(user.uid) }, wardrobe: rows.map((r) => JSON.parse(r)), inventory: inv, achievements });
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
    if (!user) { res.status(401).json({ error: 'signed_out' }); return; }
    const body = parseBody(req);
    if (await overLimit(req, `me:${user.uid}`, 30)) { res.status(429).json({ error: 'slow_down' }); return; }

    if (body.action === 'name') {
      const name = String(body.name || '').replace(/[^A-Za-z0-9_ .-]/g, '').trim().slice(0, 16).toUpperCase();
      if (name.length < 2 || slugOf(name).length < 2) { res.status(400).json({ error: 'name' }); return; }
      // Names are unique: each one is a profile URL (/profiles/<slug>).
      const holder = await redis('GET', `profile:${slugOf(name)}`);
      if (holder && holder !== user.uid) { res.status(409).json({ error: 'taken' }); return; }
      const old = slugOf(user.name);
      if (old !== slugOf(name) && (await redis('GET', `profile:${old}`)) === user.uid) await redis('DEL', `profile:${old}`);
      user.name = name; await saveUser(user);
      const profile = await claimProfile(user);
      res.status(200).json({ ok: true, name, profile }); return;
    }
    if (body.action === 'skin') {
      const buf = Buffer.from(String(body.png || ''), 'base64');
      if (!isPng(buf)) { res.status(400).json({ error: 'skin' }); return; }
      await redis('SET', `user:${user.uid}:skin`, buf.toString('base64'));
      res.status(200).json({ ok: true }); return;
    }
    if (body.action === 'save') {
      const look = cleanLook(body.look, await unlocksFor(user), isOwner(user));
      if (!look) { res.status(400).json({ error: 'look' }); return; }
      const key = `user:${user.uid}:wardrobe`;
      const rows = ((await redis('LRANGE', key, 0, MAX_LOOKS - 1)) || []).map((r) => JSON.parse(r));
      if (rows.some((r) => lookKey(r.look) === lookKey(look))) { res.status(200).json({ ok: true, duplicate: true, coins: user.coins || 0, daily: await dailyOf(user.uid) }); return; }
      if (rows.length >= MAX_LOOKS) { res.status(400).json({ error: 'full' }); return; }
      const item = { id: crypto.randomBytes(6).toString('base64url'), look, at: new Date().toISOString() };
      await redis('LPUSH', key, JSON.stringify(item));
      // Coins are earned once per distinct look ever saved, so delete-and-resave can't farm them.
      // +10 GOOD® COINS for each of the first 2 new fits saved each day (UTC). The day's
      // counter is created with its expiry first (NX), then counted up.
      const { ft: _ft, ...recipe } = look;   // a touch-up of the same fit doesn't earn again
      const fresh = await redis('SADD', `user:${user.uid}:earned`, sha(lookKey(recipe)));
      const today = new Date().toISOString().slice(0, 10);
      let earned = false;
      if (fresh) {
        const dayKey = `user:${user.uid}:coins2:${today}`;
        await redis('SET', dayKey, 0, 'EX', 172800, 'NX');
        earned = (await redis('INCR', dayKey)) <= SAVES_PER_DAY;
      }
      if (earned) { user.coins = (user.coins || 0) + COINS_PER_SAVE; await saveUser(user); }
      res.status(200).json({ ok: true, item, coins: user.coins || 0, earned: earned ? COINS_PER_SAVE : 0, capped: !!(fresh && !earned), daily: await dailyOf(user.uid) }); return;
    }
    if (body.action === 'prefs') {
      user.prefs = cleanPrefs(body.prefs, await unlocksFor(user), isOwner(user));
      await saveUser(user);
      res.status(200).json({ ok: true }); return;
    }
    if (body.action === 'suggest') {
      const text = String(body.text || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1000);
      if (text.length < 3) { res.status(400).json({ error: 'empty' }); return; }
      // At most 10 suggestions an hour per account.
      const hk = `user:${user.uid}:suggest:${new Date().toISOString().slice(0, 13)}`;
      await redis('SET', hk, 0, 'EX', 3700, 'NX');
      if ((await redis('INCR', hk)) > 10) { res.status(429).json({ error: 'slow_down' }); return; }
      await redis('LPUSH', 'suggestions', JSON.stringify({ name: user.name, text, at: new Date().toISOString() }));
      await redis('LTRIM', 'suggestions', 0, 499);
      res.status(200).json({ ok: true }); return;
    }
    if (body.action === 'title') {
      // Name a saved fit (shown on the account page and the public profile). Empty clears it.
      const title = String(body.title || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 32).toUpperCase();
      const key = `user:${user.uid}:wardrobe`;
      const rows = (await redis('LRANGE', key, 0, MAX_LOOKS - 1)) || [];
      const i = rows.findIndex((r) => JSON.parse(r).id === body.id);
      if (i < 0) { res.status(404).json({ error: 'not_found' }); return; }
      const item = JSON.parse(rows[i]);
      if (title) item.title = title; else delete item.title;
      await redis('LSET', key, i, JSON.stringify(item));
      res.status(200).json({ ok: true, title }); return;
    }
    if (body.action === 'remove') {
      const key = `user:${user.uid}:wardrobe`;
      const rows = (await redis('LRANGE', key, 0, MAX_LOOKS - 1)) || [];
      const hit = rows.find((r) => JSON.parse(r).id === body.id);
      if (hit) await redis('LREM', key, 1, hit);
      res.status(200).json({ ok: true }); return;
    }
    if (body.action === 'delete') {
      await redis('DEL', `user:${user.uid}`, `user:${user.uid}:skin`, `user:${user.uid}:wardrobe`, `user:${user.uid}:earned`, `user:${user.uid}:inv`, `user:${user.uid}:owned`, `user:${user.uid}:ach`, `user:email:${sha(user.email)}`);
      if ((await redis('GET', `profile:${slugOf(user.name)}`)) === user.uid) await redis('DEL', `profile:${slugOf(user.name)}`);
      await redis('SREM', 'users:all', user.uid);
      for (const d of ACH.DEFS) await redis('SREM', `ach:${d.id}`, user.uid);
      await endSession(req, res);
      res.status(200).json({ ok: true }); return;
    }
    res.status(400).json({ error: 'action' });
  } catch (err) {
    res.status(502).json({ error: 'storage' });
  }
};
