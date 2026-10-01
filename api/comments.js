// Vercel serverless function: STUDY® comments.
//   GET  /api/comments?post=<slug>              -> { comments: [{ name, text, at }] } (newest first)
//   POST /api/comments  { post, name, text, website }
// Stored in Upstash Redis over its REST API (add the Upstash Redis integration
// from the Vercel Marketplace; with prefix KV it sets KV_REST_API_URL /
// KV_REST_API_TOKEN). Without it, 503.
// Comments are plain text: the page renders them with textContent, never HTML.
// Light abuse guards: a honeypot field, length limits, 3 posts a minute per IP.

const crypto = require('crypto');

// Any prefix works (KV_, STORAGE_, ...): take the first *_REST_API_URL with a matching token.
const env = process.env;
const pre = ['KV', 'STORAGE', 'UPSTASH_REDIS']
  .concat(Object.keys(env).filter((k) => k.endsWith('_REST_API_URL')).map((k) => k.slice(0, -'_REST_API_URL'.length)))
  .find((p) => env[`${p}_REST_API_URL`] && env[`${p}_REST_API_TOKEN`]);
const URL_ = pre ? env[`${pre}_REST_API_URL`] : env.UPSTASH_REDIS_REST_URL;
const TOKEN = pre ? env[`${pre}_REST_API_TOKEN`] : env.UPSTASH_REDIS_REST_TOKEN;
const KEEP = 500;                     // comments kept per post
const SLUG = /^[a-z0-9-]{1,60}$/;

async function redis(...cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}

// Plain text, one line for names; control characters removed.
const clean = (s, max, multiline) => String(s || '')
  .replace(multiline ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim()
  .slice(0, max);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) {
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

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};
    if (body.website) { res.status(200).json({ ok: true }); return; } // honeypot: bots fill it, people never see it
    const post = String(body.post || '');
    const name = clean(body.name, 40, false) || 'ANONYMOUS';
    const text = clean(body.text, 1000, true);
    if (!SLUG.test(post)) { res.status(400).json({ error: 'post' }); return; }
    if (text.length < 2) { res.status(400).json({ error: 'empty' }); return; }

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const rl = `study:rl:${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24)}`;
    // Create the counter with its expiry first (NX), so a failed call can never
    // leave a counter without a TTL.
    await redis('SET', rl, 0, 'EX', 60, 'NX');
    const n = await redis('INCR', rl);
    if (n > 3) { res.status(429).json({ error: 'slow_down' }); return; }

    const comment = { name, text, at: new Date().toISOString() };
    await redis('LPUSH', `study:comments:${post}`, JSON.stringify(comment));
    await redis('LTRIM', `study:comments:${post}`, 0, KEEP - 1);
    res.status(200).json({ ok: true, comment });
  } catch (err) {
    res.status(502).json({ error: 'storage' });
  }
};
