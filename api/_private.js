// The private pieces (tools/private-seal.js), read from the sealed catalogue. Not a route.
// The owner and the private guests (api/_account.js) wear them. A colour marked only: 'owner' is
// the owner's alone; only: ['owner', 'royal'] is the owner's and those guests'. Unmarked colours
// go to the owner and the guests in ALL_GUESTS. Anyone may see them on a profile (drawn from scrambled data), never
// equip them: MAKER® only gets the catalogue for the owner and guests (?private=1).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let cat = null;
function catalogue() {
  if (cat) return cat;
  try {
    const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
    if (key.length !== 32) return { tops: [], pants: [], accessories: [] };
    const { iv, tag, data } = JSON.parse(fs.readFileSync(path.join(__dirname, '_private', 'index.enc'), 'utf8'));
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    cat = JSON.parse(Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8'));
  } catch { cat = { tops: [], pants: [], accessories: [] }; }
  return cat;
}
// The catalogue cut down: to what this viewer may wear ('owner' or a guest's slug), or to the
// colours a set of looks uses (a profile's fits). Who a colour is for never leaves the server.
function cut(keep) {
  const c = catalogue(), out = {};
  for (const part of ['tops', 'pants', 'accessories']) {
    out[part] = (c[part] || []).map((k) => ({ ...k, colors: k.colors.filter(keep).map(({ only, ...x }) => x) })).filter((k) => k.colors.length);
  }
  return out;
}
const ALL_GUESTS = ['chinny'];
const mayWear = (who, c) => who === 'owner' || (Array.isArray(c.only) ? c.only.includes(who) : !c.only && ALL_GUESTS.includes(who));
const forViewer = (who) => cut((c) => mayWear(who, c));
function forLooks(looks) {
  const used = new Set(looks.flatMap((L) => [L.top, L.bottom, L.acc].filter(Boolean).map(String)));
  return cut((c) => used.has(c.id));
}
const cache = {};
function privateIds(who = 'owner') {
  if (cache[who]) return cache[who];
  const ids = { tops: new Set(), bottoms: new Map(), accs: new Set() };
  const c = forViewer(who);
  for (const k of c.tops) for (const x of k.colors) ids.tops.add(x.id);
  for (const k of c.pants) for (const x of k.colors) ids.bottoms.set(x.id, Object.keys(x.shoes || k.shoes || {}));
  for (const k of c.accessories) for (const x of k.colors) ids.accs.add(x.id);
  return (cache[who] = ids);
}

module.exports = { privateIds, forViewer, forLooks };
