// Accounts: sessions and users in Upstash Redis (see _redis.js). Not a route.
//   user:<uid>              -> JSON { uid, email, name, coins, created }
//   user:email:<sha(email)> -> uid
//   user:<uid>:skin         -> base64 PNG (the home skin)
//   user:<uid>:wardrobe     -> list of JSON looks (newest first)
//   user:<uid>:inv          -> list of JSON crate rolls { id, item, serial, at } (newest first)
//   user:<uid>:owned        -> set of crate item ids rolled at least once
//   profile:<slug>          -> uid: the public profile at /profiles/<slug> (slug = the GOOD® name)
//   sess:<sha(sid)>         -> uid, 30 days
// The session id lives only in an HttpOnly cookie; Redis stores its hash.
const crypto = require('crypto');
const { redis } = require('./_redis');

const COOKIE = 'good_sid';
const SESSION_DAYS = 30;
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}
async function currentUser(req) {
  const sid = cookies(req)[COOKIE];
  if (!sid || !/^[A-Za-z0-9_-]{20,80}$/.test(sid)) return null;
  const uid = await redis('GET', `sess:${sha(sid)}`);
  if (!uid) return null;
  const raw = await redis('GET', `user:${uid}`);
  return raw ? JSON.parse(raw) : null;
}
async function startSession(res, uid) {
  const sid = crypto.randomBytes(32).toString('base64url');
  await redis('SET', `sess:${sha(sid)}`, uid, 'EX', SESSION_DAYS * 86400);
  res.setHeader('Set-Cookie', `${COOKIE}=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
}
async function endSession(req, res) {
  const sid = cookies(req)[COOKIE];
  if (sid) await redis('DEL', `sess:${sha(sid)}`);
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
const saveUser = (u) => redis('SET', `user:${u.uid}`, JSON.stringify(u));

// Preview-only (locked) pieces unlocked for particular accounts, keyed by the
// sha256 of the account email (so no email sits in this public repo).
const OWNER = '402fb6989f1b7e8cf49c604bd500e77fef3bc4fb340372fc7d5415ee09717511';
const isOwner = (user) => !!user && sha(String(user.email).toLowerCase()) === OWNER;
// Accounts besides the owner who see the private pieces (api/_private: MAKER® and their
// wardrobe), by the profile slug their account holds.
const PRIVATE_GUESTS = ['globohomo123'];
async function seesPrivate(user) {
  if (!user) return false;
  if (isOwner(user)) return true;
  for (const slug of PRIVATE_GUESTS) if ((await redis('GET', `profile:${slug}`)) === user.uid) return true;
  return false;
}
const UNLOCKS = {
  // owner: plus every GOOD® CRATE Nº002 piece (kind ids), which the owner wore before it opened
  '402fb6989f1b7e8cf49c604bd500e77fef3bc4fb340372fc7d5415ee09717511': ['goodie-im-sowwy', 'goodie-black-chrome',
    'c2-chore', 'c2-trench', 'c2-inside-out', 'c2-baby-hoodie', 'c2-baby-cozyknit', 'c2-jean-splatter', 'c2-jean-ice',
    'c2-jean-bleached', 'c2-jeajean', 'c2-jean-painter', 'c2-baby-tights', 'c2-scarf'],
};
// Plus anything the account owns a serialized copy of from the GOOD® CRATE.
async function unlocksFor(user) {
  if (!user) return [];
  const { ITEMS, ITEMS2 } = require('./_crate');
  const owned = (await redis('SMEMBERS', `user:${user.uid}:owned`)) || [];
  const fromCrate = owned.map((id) => (ITEMS[id] || ITEMS2[id] || {}).unlock).filter(Boolean);
  return [...new Set([...(UNLOCKS[sha(String(user.email).toLowerCase())] || []), ...fromCrate])];
}

// Profile URL from a GOOD® name: LEEEEEMS -> leeeeems, BIG G. -> big-g
// Profile tags shown next to a member's name (by profile slug), beside ADMIN.
const TAGS = { mova: ['STREAMER'], mova_tv: ['STREAMER'] };
const tagsOf = (name) => TAGS[slugOf(name)] || [];
const slugOf = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '');
// Claim the profile URL for this name if it's free; returns the slug if it's the account's.
async function claimProfile(user) {
  const slug = slugOf(user.name);
  if (slug.length < 2) return null;
  await redis('SET', `profile:${slug}`, user.uid, 'NX');
  return (await redis('GET', `profile:${slug}`)) === user.uid ? slug : null;
}

module.exports = { sha, currentUser, startSession, endSession, saveUser, unlocksFor, isOwner, seesPrivate, slugOf, tagsOf, claimProfile };
