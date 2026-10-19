// GUD™ went live on 19 October 2026 (released early, at the owner's word). Not a route.
// Until then every GUD™ file (api/_locked/gud-*.enc: the pieces, renders and the sealed
// catalogue gud-index) answers like an unknown id; from then on they're public.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GUD_DROP = Date.parse('2026-10-19T00:00:00-04:00');
const gudOpen = (now = Date.now()) => now >= GUD_DROP;

// The GUD™ catalogue (THE MAKER ids), for checking saved fits once it's live.
let ids = null;
function gudIds() {
  if (!gudOpen()) return { tops: new Set(), bottoms: new Map() };
  if (ids) return ids;
  ids = { tops: new Set(), bottoms: new Map() };
  try {
    const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
    const { iv, tag, data } = JSON.parse(fs.readFileSync(path.join(__dirname, '_locked', 'gud-index.enc'), 'utf8'));
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    const cat = JSON.parse(Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8'));
    for (const k of cat.tops) for (const c of k.colors) ids.tops.add(c.id);
    for (const k of cat.pants) for (const c of k.colors) ids.bottoms.set(c.id, Object.keys(c.shoes || {}));
  } catch { /* no catalogue */ }
  return ids;
}

module.exports = { GUD_DROP, gudOpen, gudIds };
