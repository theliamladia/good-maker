// GOOD® ACHIEVEMENTS. Not a route.
//   user:<uid>:ach          -> set of achievement ids the account has
//   user:<uid>:ach:<id>     -> ISO time it was earned
//   ach:<id>                -> set of uids that have it (for the % of players)
//   users:all               -> set of every account uid (the % denominator)
//   ach:weewy-sowwy:first   -> the uid of the first GOODIE® I'M SOWWY pull
const { redis } = require('./_redis');

const DEFS = [
  { id: 'signed-up', name: 'SIGNED UP!', desc: 'You registered an account.', icon: 'assets/ach/signed-up.svg' },
  { id: 'weewy-sowwy', name: "I'M WEEWY SOWWY", desc: "Be the first to get the I'M SOWWY GOODIE®.", icon: 'assets/ach/weewy-sowwy.png' },
  { id: 'im-sowwy', name: "I'M SOWWY", desc: "Get the rare I'M SOWWY drop on GOOD® CRATE Nº001.", icon: 'assets/ach/im-sowwy.png' },
];

async function award(uid, id) {
  if (!(await redis('SADD', `user:${uid}:ach`, id))) return false;
  await redis('SET', `user:${uid}:ach:${id}`, new Date().toISOString(), 'NX');
  await redis('SADD', `ach:${id}`, uid);
  return true;
}

// Every account has SIGNED UP!; called whenever the account is loaded.
async function touch(uid) {
  await redis('SADD', 'users:all', uid);
  await award(uid, 'signed-up');
}

// A crate pull: the first GOODIE® I'M SOWWY ever is I'M WEEWY SOWWY; any other
// I'M SOWWY pull (the GOODIE® after that, or either shirt) is I'M SOWWY.
async function onPull(uid, item) {
  const got = [];
  if (item === 'goodie-im-sowwy' && (await redis('SET', 'ach:weewy-sowwy:first', uid, 'NX'))) {
    if (await award(uid, 'weewy-sowwy')) got.push('weewy-sowwy');
  } else if (['goodie-im-sowwy', 'shirt-im-sowwy', 'shirt-ii-im-sowwy'].includes(item)) {
    if (await award(uid, 'im-sowwy')) got.push('im-sowwy');
  }
  return got.map((id) => DEFS.find((d) => d.id === id));
}

// The account's view: every achievement, whether it's earned (and when), and
// the % of players that have it.
async function list(uid) {
  const total = (await redis('SCARD', 'users:all')) || 1;
  const mine = new Set((await redis('SMEMBERS', `user:${uid}:ach`)) || []);
  const out = [];
  for (const d of DEFS) {
    const n = (await redis('SCARD', `ach:${d.id}`)) || 0;
    out.push({ ...d, earned: mine.has(d.id), at: mine.has(d.id) ? await redis('GET', `user:${uid}:ach:${d.id}`) : null, pct: Math.round((n / total) * 1000) / 10 });
  }
  return out;
}

module.exports = { DEFS, award, touch, onPull, list };
