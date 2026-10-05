// Vercel serverless function: GOOD® GALLERY, the newest looks people posted.
//   GET  /api/gallery                 -> { looks: [{ u, top, bottom, shoe, sleeve, body, tuck, boxer, at }] } (newest first)
//   POST /api/gallery  { u, top, bottom, shoe, sleeve, body, tuck, boxer, website }
// A look is stored as its recipe (Minecraft username + catalogue ids), never as
// a picture: the homepage rebuilds each one from the player's own skin.
// Only catalogue ids are accepted, and preview-only (locked) pieces can't be
// posted. Stored in Upstash Redis (see _redis.js). Without it, 503.
// Abuse guards: a honeypot field, 3 posts a minute per IP, one entry per player
// (posting again replaces your last look).

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { redis, configured, overLimit, parseBody } = require('./_redis');

const KEY = 'gallery:looks';
const KEEP = 120;
const NAME = /^[A-Za-z0-9_]{3,16}$/;

// The catalogue, read from the same file the page uses.
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/outfits.js'), 'utf8'), { window: win });
const TOPS = new Map();
for (const k of win.OUTFITS) for (const c of k.colors || [k]) TOPS.set(c.id, { locked: !!(k.locked || c.locked), long: !!c.long, short: !!c.bodies, bodies: Object.keys(c.long || c.bodies || {}) });
const BOTTOMS = new Map();
for (const k of win.PANTS) for (const c of k.colors || [k]) BOTTOMS.set(c.id, { shoes: Object.keys(k.shoes || {}), boxers: !!k.boxers });

function recipe(b) {
  const u = String(b.u || '');
  const top = TOPS.get(String(b.top || ''));
  const bottom = BOTTOMS.get(String(b.bottom || ''));
  if (!NAME.test(u)) return { error: 'name' };
  if (!top || !bottom) return { error: 'look' };
  if (top.locked) return { error: 'locked' };
  const look = { u, top: String(b.top), bottom: String(b.bottom) };
  if (bottom.shoes.includes(b.shoe)) look.shoe = b.shoe;
  if (['short', 'long'].includes(b.sleeve) && (b.sleeve === 'long' ? top.long : top.short)) look.sleeve = b.sleeve;
  if (top.bodies.includes(b.body)) look.body = b.body;
  if (b.tuck === 'out') look.tuck = 'out';
  if (bottom.boxers && b.boxer === 'tartan') look.boxer = 'tartan';
  return { look };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  try {
    if (req.method === 'GET') {
      const rows = (await redis('LRANGE', KEY, 0, KEEP - 1)) || [];
      const looks = rows.map((r) => { try { return JSON.parse(r); } catch { return null; } })
        .filter((l) => l && TOPS.has(l.top) && !TOPS.get(l.top).locked && BOTTOMS.has(l.bottom));
      res.status(200).json({ looks });
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }

    const body = parseBody(req);
    if (body.website) { res.status(200).json({ ok: true }); return; } // honeypot
    const { look, error } = recipe(body);
    if (error) { res.status(400).json({ error }); return; }
    if (await overLimit(req, 'gallery', 3)) { res.status(429).json({ error: 'slow_down' }); return; }

    look.at = new Date().toISOString();
    // One entry per player: drop their previous look, then add this one on top.
    const rows = (await redis('LRANGE', KEY, 0, KEEP - 1)) || [];
    for (const r of rows) {
      try { if (JSON.parse(r).u.toLowerCase() === look.u.toLowerCase()) await redis('LREM', KEY, 0, r); } catch { /* skip bad rows */ }
    }
    await redis('LPUSH', KEY, JSON.stringify(look));
    await redis('LTRIM', KEY, 0, KEEP - 1);
    res.status(200).json({ ok: true, look });
  } catch (err) {
    res.status(502).json({ error: 'storage' });
  }
};
