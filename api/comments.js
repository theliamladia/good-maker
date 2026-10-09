// Vercel serverless function: STUDY® comments.
//   GET  /api/comments?post=<slug>              -> { comments: [{ name, text, at }] } (newest first)
//   POST /api/comments  { post, name, text, website }  (signed in: the account name is used)
// Stored in Upstash Redis (see _redis.js). Without it, 503.
// Comments are plain text: the page renders them with textContent, never HTML.
// Light abuse guards: a honeypot field, length limits, 3 posts a minute per IP.

const { redis, configured, overLimit, parseBody } = require('./_redis');
const { currentUser } = require('./_account');

const KEEP = 500;                     // comments kept per post
const SLUG = /^[a-z0-9-]{1,60}$/;

// Plain text, one line for names; control characters removed.
const clean = (s, max, multiline) => String(s || '')
  .replace(multiline ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim()
  .slice(0, max);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }
  try {
    if (req.method === 'GET') {
      const post = String((req.query && req.query.post) || '');
      if (!SLUG.test(post)) { res.status(400).json({ error: 'post' }); return; }
      const rows = (await redis('LRANGE', `study:comments:${post}`, 0, KEEP - 1)) || [];
      const comments = rows.map((r) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
      res.status(200).json({ comments });
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }

    const body = parseBody(req);
    if (body.website) { res.status(200).json({ ok: true }); return; } // honeypot: bots fill it, people never see it
    const post = String(body.post || '');
    // Signed in: the comment carries the account's GOOD® name (it can't be typed in).
    const user = await currentUser(req);
    const name = user ? user.name : clean(body.name, 40, false) || 'ANONYMOUS';
    const text = clean(body.text, 1000, true);
    if (!SLUG.test(post)) { res.status(400).json({ error: 'post' }); return; }
    if (text.length < 2) { res.status(400).json({ error: 'empty' }); return; }

    if (await overLimit(req, 'study', 3)) { res.status(429).json({ error: 'slow_down' }); return; }

    const comment = { name, text, at: new Date().toISOString(), ...(user ? { member: true } : {}) };
    await redis('LPUSH', `study:comments:${post}`, JSON.stringify(comment));
    await redis('LTRIM', `study:comments:${post}`, 0, KEEP - 1);
    res.status(200).json({ ok: true, comment });
  } catch (err) {
    res.status(502).json({ error: 'storage' });
  }
};
