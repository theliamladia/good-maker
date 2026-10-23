// Gated drops. Not a route. Before its date every file of a drop (api/_locked/<prefix>*.enc:
// the pieces and the sealed catalogue <index>) answers like an unknown id; from then on
// they're public. A drop with at: null stays shut until it gets a date.
//   GUD™ went live on 19 October 2026 (released early, at the owner's word).
//   WANDERING® went live on 23 October 2026, at the owner's word.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DROPS = {
  gud: { at: Date.parse('2026-10-19T00:00:00-04:00'), prefix: 'gud-', index: 'gud-index' },
  wandering: { at: Date.parse('2026-10-23T00:00:00-04:00'), prefix: 'wdm-', index: 'wdm-index' },
};
const isOpen = (name, now = Date.now()) => { const d = DROPS[name]; return !!d && d.at !== null && now >= d.at; };
const dropOf = (id) => Object.keys(DROPS).find((n) => id.startsWith(DROPS[n].prefix)) || null;

// The open drops' catalogues (MAKER® ids), for checking saved fits.
const cache = {};
function dropIds() {
  const ids = { tops: new Set(), bottoms: new Map() };
  for (const name of Object.keys(DROPS)) {
    if (!isOpen(name)) continue;
    if (!cache[name]) {
      cache[name] = { tops: new Set(), bottoms: new Map() };
      try {
        const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
        const { iv, tag, data } = JSON.parse(fs.readFileSync(path.join(__dirname, '_locked', `${DROPS[name].index}.enc`), 'utf8'));
        const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
        d.setAuthTag(Buffer.from(tag, 'base64'));
        const cat = JSON.parse(Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8'));
        for (const k of cat.tops) for (const c of k.colors) cache[name].tops.add(c.id);
        for (const k of cat.pants) for (const c of k.colors) cache[name].bottoms.set(c.id, Object.keys(c.shoes || {}));
      } catch { /* no catalogue */ }
    }
    for (const t of cache[name].tops) ids.tops.add(t);
    for (const [b, s] of cache[name].bottoms) ids.bottoms.set(b, s);
  }
  return ids;
}

module.exports = { DROPS, isOpen, dropOf, dropIds };
