// Local copy of the site with every /api route running against an in-memory Redis.
//   node tools/dev/devserver.js [port=8798]
// Signed in as TESTER (20 GOOD® COINS) via the cookie good_sid=testsession_abcdefghijklmnop
// (set it in Playwright with context.addCookies). Sealed previews (/api/outfit) need the key:
//   GOOD_LOCK_KEY=… node tools/dev/devserver.js   (never commit the key; see CLAUDE.md)
// Seed more state by POSTing ["CMD", ...args] to http://localhost:8797 (the fake Redis).
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const R = path.join(__dirname, '..', '..');
process.env.KV_REST_API_URL = 'http://localhost:' + (process.env.FAKEREDIS_PORT || 8797); process.env.KV_REST_API_TOKEN = 't';
require('./fakeredis.js');
const PORT = +process.argv[2] || 8798;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.ico': 'image/x-icon' };
const redis = (cmd) => fetch(process.env.KV_REST_API_URL, { method: 'POST', body: JSON.stringify(cmd) }).then((x) => x.json());
const res2 = (res) => ({ setHeader(k, v) { res.setHeader(k, v); }, status(c) { this.c = c; return this; },
  json(o) { res.writeHead(this.c || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); },
  send(x) { res.writeHead(this.c || 200); res.end(x); }, end(x) { res.writeHead(this.c || 200); res.end(x); } });
(async () => {
  await new Promise((ok) => setTimeout(ok, 200));
  const sid = 'testsession_abcdefghijklmnop', sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
  await redis(['SET', 'sess:' + sha(sid), 'u1']);
  await redis(['SET', 'user:u1', JSON.stringify({ uid: 'u1', name: 'TESTER', email: 't@example.com', coins: 20, created: '2026-10-01' })]);
  http.createServer((req, res) => {
    const [u, q] = req.url.split('?');
    req.query = Object.fromEntries(new URLSearchParams(q || ''));
    const m = u.match(/^\/api\/([a-z0-9-]+)$/);
    if (m && fs.existsSync(path.join(R, 'api', m[1] + '.js'))) {
      let b = ''; req.on('data', (d) => (b += d)).on('end', () => {
        try { req.body = b ? JSON.parse(b) : {}; } catch { req.body = b; }
        Promise.resolve(require(path.join(R, 'api', m[1] + '.js'))(req, res2(res))).catch((e) => { res.writeHead(500); res.end(String(e)); });
      });
      return;
    }
    let f = path.join(R, decodeURIComponent(u === '/' ? '/index.html' : u.replace(/(.)\/$/, '$1')));   // /q/ serves q.html, like Vercel
    if (u.startsWith('/profiles/')) f = path.join(R, 'profile.html');
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
    if (!f.startsWith(R)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
  }).listen(PORT, () => console.log(`GOOD® dev server on http://localhost:${PORT} (fake Redis on ${process.env.KV_REST_API_URL})`));
})();
