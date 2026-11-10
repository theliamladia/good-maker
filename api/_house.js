// HOUSE®: MARKET® exclusives. Not a route (api/crate.js serves it: GET ?crate=house, POST action 'house').
// Pieces from MAKER® (basics, crates, collabs; GOOD® and BABY®) in colourways MAKER® never gets,
// each one of one. Four sit on the shelf; when one is bought, another takes its place: never the
// same piece or the same colourway as the one that just sold, and not the same colour family as
// the last one placed (so it isn't brights every time).
//
// The pool is sealed (api/_locked/hse-index.enc, built by tools/studio/work/house/seal.js): nothing
// shows what's coming. Only pieces that have been on the shelf are ever named.
//   house:shelf   -> JSON [hid, hid, hid, hid]
//   house:shown   -> set of hids that have been on the shelf (named in the item table)
//   house:sold    -> set of hids sold
//   house:serial  -> counter (HSE-001, HSE-002, ... in the order they sell)
//   house:last    -> the colour family of the last piece placed
//   house:day     -> the day (New York time) the shelf was last reset
// Every day at midnight New York time the unsold pieces go back into the pool and four new ones
// come out (owner: reset every 24 hours). Never the four that were just there.
// Until HOUSE® ships (OPEN), only the owner sees or buys it.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { redis } = require('./_redis');

const OPEN = true;   // shipped 10 November 2026, at the owner's word
const SHELF = 4;

let pool = null;
function poolAll() {
  if (pool) return pool;
  try {
    const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
    const { iv, tag, data } = JSON.parse(fs.readFileSync(path.join(__dirname, '_locked', 'hse-index.enc'), 'utf8'));
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    pool = JSON.parse(Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8'));
  } catch { pool = []; }
  return pool;
}
const byId = (hid) => poolAll().find((p) => p.hid === hid);
const tm = (color) => color.split('/').map((c) => (/[®™ⓤ]$/.test(c) ? c : `${c}™`)).join('/');
// What the pages see of a piece: name, colourway, colour dots, price and the texture to draw.
const pub = (p) => p && ({ id: p.hid, name: p.name, color: tm(p.color), hex: p.hex, tier: 'house', price: p.price, line: p.line,
  tex: p.tex, bottom: p.part === 'bottom' || undefined });

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(0, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// The next piece for an empty slot. Hard rules: not sold, not on the shelf, not the piece or the
// colourway that just sold. Then, as far as the pool allows: a family other than the last one
// placed, and a piece (kind) that isn't already on the shelf.
async function next(shelf, sold, gone, skip = new Set()) {
  const last = await redis('GET', 'house:last');
  const onShelf = shelf.filter(Boolean).map(byId).filter(Boolean);
  const free = poolAll().filter((p) => !sold.has(p.hid) && !shelf.includes(p.hid) && !skip.has(p.hid)
    && !(gone && (p.kind === gone.kind || p.color === gone.color)));
  const tiers = [
    (p) => p.family !== last && (!gone || p.family !== gone.family) && !onShelf.some((o) => o.kind === p.kind || o.family === p.family),
    (p) => p.family !== last && !onShelf.some((o) => o.kind === p.kind),
    (p) => !onShelf.some((o) => o.kind === p.kind),
    () => true,
  ];
  for (const ok of tiers) { const c = free.filter(ok); if (c.length) return shuffle(c)[0]; }
  return null;
}
async function place(shelf, i, sold, gone, skip) {
  const p = await next(shelf, sold, gone, skip);
  shelf[i] = p ? p.hid : null;
  if (p) { await redis('SET', 'house:last', p.family); await redis('SADD', 'house:shown', p.hid); }
}
async function state() {
  const shelf = JSON.parse((await redis('GET', 'house:shelf')) || '[]');
  const sold = new Set((await redis('SMEMBERS', 'house:sold')) || []);
  return { shelf, sold };
}
// The daily reset: once per New York day (the first request after midnight does it, once).
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
async function rotate() {
  const day = today(), was = await redis('GET', 'house:day');
  if (was === day) return;
  if (!was) { await redis('SET', 'house:day', day); return; }   // the first day: keep the shelf it has
  if (!(await redis('SET', `house:reset:${day}`, 1, 'EX', 172800, 'NX'))) return;
  await redis('SET', 'house:day', day);
  const s = await state(), skip = new Set(s.shelf.filter(Boolean)), fresh = [];
  for (let i = 0; i < SHELF; i++) await place(fresh, i, s.sold, null, skip);
  await redis('SET', 'house:shelf', JSON.stringify(fresh));
}
// The shelf, filled if anything is missing (first run, or the pool grew).
async function shelf() {
  await rotate();
  const s = await state();
  let changed = false;
  for (let i = 0; i < SHELF; i++) if (!s.shelf[i] || s.sold.has(s.shelf[i]) || !byId(s.shelf[i])) { await place(s.shelf, i, s.sold, null); changed = true; }
  if (changed) await redis('SET', 'house:shelf', JSON.stringify(s.shelf));
  return s.shelf.map(byId).filter(Boolean).map(pub);
}
// Every piece that has been on the shelf (to name copies in inventories, listings and trades).
async function shown() {
  const ids = (await redis('SMEMBERS', 'house:shown')) || [];
  return ids.map(byId).filter(Boolean).map(pub);
}
// Buy: the caller holds the account's coin lock. Returns { entry, shelf } or { error }.
async function buy(user, hid, saveUser) {
  const p = byId(hid);
  if (!p) return { error: 'gone' };
  // one buyer per piece, even if two arrive at once
  await rotate();
  if (!(await redis('SET', `house:lock:${hid}`, user.uid, 'EX', 15, 'NX'))) return { error: 'gone' };
  try {
    const s = await state();
    const i = s.shelf.indexOf(hid);
    if (i < 0 || s.sold.has(hid)) return { error: 'gone' };
    if ((user.coins || 0) < p.price) return { error: 'coins', coins: user.coins || 0 };
    user.coins -= p.price;
    await saveUser(user);
    await redis('SADD', 'house:sold', hid);
    s.sold.add(hid);
    const n = await redis('INCR', 'house:serial');
    const entry = { id: crypto.randomBytes(6).toString('base64url'), item: hid, serial: `HSE-${String(n).padStart(3, '0')}`, at: new Date().toISOString() };
    await redis('LPUSH', `user:${user.uid}:inv`, JSON.stringify(entry));
    await redis('SADD', `user:${user.uid}:owned`, hid);
    await place(s.shelf, i, s.sold, p);
    await redis('SET', 'house:shelf', JSON.stringify(s.shelf));
    return { entry, coins: user.coins, item: pub(p), shelf: s.shelf.map(byId).filter(Boolean).map(pub) };
  } finally { await redis('DEL', `house:lock:${hid}`); }
}
// HOUSE® pieces as a catalogue (js/outfits.js shape): to wear (wardrobe) or to draw saved fits (forLooks).
function catalogueOf(hids) {
  const cat = { tops: [], pants: [] };
  for (const hid of new Set(hids)) {
    const p = byId(hid);
    if (!p) continue;
    const ref = (role) => `api/outfit?id=${p.files[role]}`;
    const c = { id: p.hid, color: tm(p.color), swatch: p.hex };
    for (const role of Object.keys(p.files)) {
      const [set, sub] = role.split('.');
      if (sub) (c[set] ||= {})[sub] = ref(role); else c[set] = ref(role);
    }
    const list = p.part === 'top' ? cat.tops : cat.pants;
    let k = list.find((x) => x.id === `house-${p.kind}`);
    if (!k) { k = { id: `house-${p.kind}`, name: p.name, line: p.line, ...(p.flags || {}), colors: [] }; list.push(k); }
    k.colors.push(c);
  }
  return cat;
}
// MAKER®: the pieces an account owns, to wear and download.
async function wardrobe(uid) {
  return catalogueOf(((await redis('SMEMBERS', `user:${uid}:owned`)) || []).filter((id) => id.startsWith('hse-')));
}
// A profile's fits: the HOUSE® pieces they use, to draw (never to wear).
const forLooks = (looks) => catalogueOf(looks.flatMap((L) => [L && L.top, L && L.bottom]).filter((id) => typeof id === 'string' && id.startsWith('hse-')));
// For checking saved fits (api/me.js): a piece's shoes, or null if it isn't a HOUSE® piece.
const shoesOf = (hid) => { const p = byId(hid); return p ? Object.keys(p.files).filter((r) => r.startsWith('shoes.')).map((r) => r.slice(6)) : null; };

module.exports = { OPEN, shelf, shown, buy, wardrobe, forLooks, shoesOf, pub, byId };
