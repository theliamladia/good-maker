// Seal preview-only outfit PNGs for /api/outfit.
//   GOOD_LOCK_KEY=<base64 32 bytes> node tools/lock-seal.js <id> <png> [<id> <png> ...]
// Each PNG is encrypted with AES-256-GCM under GOOD_LOCK_KEY and written to
// api/_locked/<id>.enc. The key lives only in the environment (Vercel), never
// in the repo, so the repo holds ciphertext only. Keep the PNGs out of git.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
const args = process.argv.slice(2);
if (key.length !== 32 || !args.length || args.length % 2) { console.error('usage: GOOD_LOCK_KEY=... node tools/lock-seal.js <id> <png> ...'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'api', '_locked');
fs.mkdirSync(OUT, { recursive: true });
for (let i = 0; i < args.length; i += 2) {
  const [id, file] = [args[i], args[i + 1]];
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('bad id ' + id);
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([c.update(fs.readFileSync(file)), c.final()]);
  fs.writeFileSync(path.join(OUT, `${id}.enc`), JSON.stringify({ iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') }));
  console.log('sealed', id);
}
