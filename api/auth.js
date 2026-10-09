// Vercel serverless function: email sign-in links.
//   POST /api/auth { action: 'request', email }  -> emails a one-time link (15 min)
//   GET  /api/auth?token=...                     -> signs in, redirects to the account page
//   POST /api/auth { action: 'logout' }
// Email goes out through Resend (RESEND_API_KEY; sender AUTH_FROM, a verified
// domain). Without a key: 503 email_not_configured. Accounts are created on
// first sign-in. The token is stored hashed and works once.
const crypto = require('crypto');
const { redis, configured, overLimit, parseBody } = require('./_redis');
const { sha, startSession, endSession, saveUser } = require('./_account');

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const SITE = process.env.SITE_URL || 'https://good-maker.vercel.app';

async function sendLink(email, link) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.AUTH_FROM || 'GOOD DESIGN <onboarding@resend.dev>',
      ...(process.env.AUTH_REPLY_TO ? { reply_to: process.env.AUTH_REPLY_TO } : {}),
      to: [email],
      subject: 'Your GOOD DESIGN sign-in link',
      text: `Tap to sign in to GOOD® DESIGN:\n\n${link}\n\nThe link works once and expires in 15 minutes. If you didn't ask for it, ignore this email.`,
      html: `<div style="font-family:Helvetica,Arial,sans-serif;background:#0000ff;color:#fff;padding:40px"><p style="font-size:28px;font-weight:800;margin:0 0 24px">GOOD® DESIGN</p><p style="font-size:16px;margin:0 0 28px">Tap below to sign in. The link works once and expires in 15 minutes.</p><p><a href="${link}" style="background:#fff;color:#0000ff;padding:14px 22px;text-decoration:none;font-weight:700;letter-spacing:2px">SIGN IN</a></p><p style="font-size:12px;opacity:.8;margin-top:32px">If you didn't ask for this, ignore this email.</p></div>`,
    }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}`);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!configured()) { res.status(503).json({ error: 'not_configured' }); return; }
  try {
    if (req.method === 'GET') {
      const token = String((req.query && req.query.token) || '');
      const key = `auth:tok:${sha(token)}`;
      const email = /^[A-Za-z0-9_-]{30,80}$/.test(token) ? await redis('GET', key) : null;
      if (!email) { res.writeHead(302, { Location: '/account.html?signin=expired' }); res.end(); return; }
      await redis('DEL', key);
      let uid = await redis('GET', `user:email:${sha(email)}`);
      if (!uid) {
        uid = crypto.randomBytes(9).toString('base64url');
        await saveUser({ uid, email, name: email.split('@')[0].slice(0, 16).toUpperCase(), coins: 0, created: new Date().toISOString() });
        await redis('SET', `user:email:${sha(email)}`, uid);
      }
      await startSession(res, uid);
      res.writeHead(302, { Location: '/account.html?signin=ok' }); res.end();
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
    const body = parseBody(req);
    if (body.action === 'logout') { await endSession(req, res); res.status(200).json({ ok: true }); return; }
    if (body.action !== 'request') { res.status(400).json({ error: 'action' }); return; }
    if (!process.env.RESEND_API_KEY) { res.status(503).json({ error: 'email_not_configured' }); return; }
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL.test(email)) { res.status(400).json({ error: 'email' }); return; }
    if (await overLimit(req, 'auth', 3)) { res.status(429).json({ error: 'slow_down' }); return; }
    const token = crypto.randomBytes(32).toString('base64url');
    await redis('SET', `auth:tok:${sha(token)}`, email, 'EX', 900);
    await sendLink(email, `${SITE}/api/auth?token=${token}`);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'server' });
  }
};
