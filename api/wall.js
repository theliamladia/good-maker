// Vercel serverless function: comments on a GOOD® profile (the profile's wall).
//   GET  /api/wall?name=<slug>                           -> { comments: [{ id, name, slug, admin, text, at }], canDelete }
//   POST /api/wall { name: <slug>, text }                 (signed in) -> { ok, comment }
//   POST /api/wall { name: <slug>, action: 'delete', id } (the profile's owner, or ADMIN) -> { ok }
// Plain text only; the page renders it with textContent. 3 posts a minute per IP.
const crypto = require('crypto');
const { redis, configured, overLimit, parseBody } = require('./_redis');
const { currentUser, isOwner, slugOf } = require('./_account');

const KEEP = 300;
const clean = (s) => String(s || '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 500);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  try {
    const q = req.method === 'GET' ? (req.query || {}) : parseBody(req);
    const slug = String(q.name || '').toLowerCase();
    if (!/^[a-z0-9_-]{2,20}$/.test(slug)) { res.status(404).json({ error: 'not_found' }); return; }
    const owner = await redis('GET', `profile:${slug}`);
    if (!owner) { res.status(404).json({ error: 'not_found' }); return; }
    const key = `wall:${owner}`;
    const me = await currentUser(req);
    const canDelete = !!me && (me.uid === owner || isOwner(me));

    if (req.method === 'GET') {
      const comments = ((await redis('LRANGE', key, 0, KEEP - 1)) || []).map((r) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean)
        .map(({ id, name, slug: s, admin, text, at }) => ({ id, name, slug: s, admin, text, at }));
      res.status(200).json({ comments, canDelete });
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
    if (!me) { res.status(401).json({ error: 'signed_out' }); return; }

    if (q.action === 'delete') {
      if (!canDelete) { res.status(403).json({ error: 'forbidden' }); return; }
      const rows = (await redis('LRANGE', key, 0, KEEP - 1)) || [];
      const hit = rows.find((r) => { try { return JSON.parse(r).id === q.id; } catch { return false; } });
      if (hit) await redis('LREM', key, 1, hit);
      res.status(200).json({ ok: true });
      return;
    }
    const text = clean(q.text);
    if (text.length < 2) { res.status(400).json({ error: 'empty' }); return; }
    if (await overLimit(req, 'wall', 3)) { res.status(429).json({ error: 'slow_down' }); return; }
    const comment = { id: crypto.randomBytes(6).toString('base64url'), name: me.name, slug: slugOf(me.name), admin: isOwner(me) || undefined, uid: me.uid, text, at: new Date().toISOString() };
    await redis('LPUSH', key, JSON.stringify(comment));
    await redis('LTRIM', key, 0, KEEP - 1);
    const { uid, ...pub } = comment;
    res.status(200).json({ ok: true, comment: pub });
  } catch {
    res.status(502).json({ error: 'storage' });
  }
};
