// Accounts: sessions and users in Upstash Redis (see _redis.js). Not a route.
//   user:<uid>              -> JSON { uid, email, name, coins, created }
//   user:email:<sha(email)> -> uid
//   user:<uid>:skin         -> base64 PNG (the home skin)
//   user:<uid>:wardrobe     -> list of JSON looks (newest first)
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
const UNLOCKS = {
  '402fb6989f1b7e8cf49c604bd500e77fef3bc4fb340372fc7d5415ee09717511': ['goodie-im-sowwy', 'goodie-black-chrome', 'shirt-im-sowwy', 'shirt-ii-im-sowwy'], // owner
};
const unlocksFor = (user) => (user && UNLOCKS[sha(String(user.email).toLowerCase())]) || [];

module.exports = { sha, currentUser, startSession, endSession, saveUser, unlocksFor };
