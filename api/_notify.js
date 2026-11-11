// NOTIFY ME on RELEASES® UPCOMING (not a route; used by api/me.js).
// Keys: notify:<dropId> = set of uids who asked; user:<uid>:notify = set of dropIds they asked for
// (so the page can show their state and DELETE ACCOUNT can take them all back out).
// The drops themselves are the list in js/upcoming.js, shared with the page.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { redis } = require('./_redis');

function upcoming() {
  try {
    const win = {};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/upcoming.js'), 'utf8'), { window: win });
    return Array.isArray(win.GOOD_UPCOMING) ? win.GOOD_UPCOMING : [];
  } catch { return []; }
}
const LIST = upcoming();

// Opt-ins are only taken while the drop is still to come.
const open = (id) => LIST.some((d) => d.id === id && Date.parse(d.date) > Date.now());

async function mine(uid) {
  if (!LIST.length) return [];   // nothing upcoming: no Redis call on every /api/me
  return ((await redis('SMEMBERS', `user:${uid}:notify`)) || []).filter((id) => LIST.some((d) => d.id === id));
}

async function set(uid, id, on) {
  id = String(id || '');
  if (on && !open(id)) return false;
  if (!LIST.some((d) => d.id === id)) return false;
  if (on) { await redis('SADD', `notify:${id}`, uid); await redis('SADD', `user:${uid}:notify`, id); }
  else { await redis('SREM', `notify:${id}`, uid); await redis('SREM', `user:${uid}:notify`, id); }
  return true;
}

// DELETE ACCOUNT: out of every list (also drops no longer on js/upcoming.js), then the index.
async function purge(uid) {
  for (const id of (await redis('SMEMBERS', `user:${uid}:notify`)) || []) await redis('SREM', `notify:${id}`, uid);
  await redis('DEL', `user:${uid}:notify`);
}

module.exports = { LIST, open, mine, set, purge };
