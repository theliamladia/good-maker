// The owner-only pieces' ids (tools/private-seal.js), read from the sealed catalogue.
// Not a route. Used to let the owner save fits with them (api/me.js) and to keep those
// fits out of anything other people can see (api/profile.js).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let cached = null;
function privateIds() {
  if (cached) return cached;
  const ids = { tops: new Set(), bottoms: new Map(), accs: new Set() };
  try {
    const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
    if (key.length !== 32) return ids;
    const { iv, tag, data } = JSON.parse(fs.readFileSync(path.join(__dirname, '_private', 'index.enc'), 'utf8'));
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    const cat = JSON.parse(Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8'));
    for (const k of cat.tops || []) for (const c of k.colors) ids.tops.add(c.id);
    for (const k of cat.pants || []) for (const c of k.colors) ids.bottoms.set(c.id, Object.keys(c.shoes || k.shoes || {}));
    for (const k of cat.accessories || []) for (const c of k.colors) ids.accs.add(c.id);
  } catch { /* no catalogue: nothing private */ }
  return (cached = ids);
}
const isPrivateLook = (L) => { const p = privateIds(); return !!L && (p.tops.has(String(L.top)) || p.bottoms.has(String(L.bottom)) || p.accs.has(String(L.acc))); };

module.exports = { privateIds, isPrivateLook };
