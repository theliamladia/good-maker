// The design vault: every design folder in tools/studio/work/ (generators, textures, render sets),
// sealed into the repo so a container reset can never lose it again. tools/studio/work/ is gitignored
// and the repo is public, so each folder is packed and encrypted (AES-256-GCM, GOOD_LOCK_KEY) into
// tools/studio/vault/<name>.enc. Renders (out/) are left out: they can be made again from these.
//   GOOD_LOCK_KEY=... node tools/studio/vault.js seal [<name> ...]   seal these work folders (all if none)
//   GOOD_LOCK_KEY=... node tools/studio/vault.js open [<name> ...]   restore them into tools/studio/work/
//   node tools/studio/vault.js list                                   what's in the vault
// Seal after every design change, in the same commit as the work it belongs to (good-lessons 21).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WORK = path.join(__dirname, 'work'), VAULT = path.join(__dirname, 'vault');
const SKIP = new Set(['out', 'backup', 'check', 'uxaudit']);
const [cmd, ...names] = process.argv.slice(2);
const key = Buffer.from(process.env.GOOD_LOCK_KEY || '', 'base64');
const need = () => { if (key.length !== 32) { console.error('GOOD_LOCK_KEY (32 bytes, base64) is needed'); process.exit(1); } };
const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p, base) : [path.relative(base, p)];
});
function seal(name) {
  const src = name === '_sets' ? WORK : path.join(WORK, name);
  const files = name === '_sets' ? fs.readdirSync(WORK).filter((f) => f.endsWith('.json')) : walk(src);
  const pack = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(src, f)).toString('base64')]));
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([c.update(Buffer.from(JSON.stringify(pack))), c.final()]);
  fs.writeFileSync(path.join(VAULT, `${name}.enc`), JSON.stringify({ iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') }));
  console.log(`sealed ${name}: ${files.length} files`);
}
function open(name) {
  const { iv, tag, data } = JSON.parse(fs.readFileSync(path.join(VAULT, `${name}.enc`), 'utf8'));
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64')); d.setAuthTag(Buffer.from(tag, 'base64'));
  const pack = JSON.parse(Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8'));
  const dest = name === '_sets' ? WORK : path.join(WORK, name);
  for (const [f, b64] of Object.entries(pack)) { fs.mkdirSync(path.dirname(path.join(dest, f)), { recursive: true }); fs.writeFileSync(path.join(dest, f), Buffer.from(b64, 'base64')); }
  console.log(`opened ${name}: ${Object.keys(pack).length} files`);
}
fs.mkdirSync(VAULT, { recursive: true });
if (cmd === 'list') { for (const f of fs.readdirSync(VAULT).filter((f) => f.endsWith('.enc'))) console.log(f.replace(/\.enc$/, ''), `${Math.round(fs.statSync(path.join(VAULT, f)).size / 1024)} KB`); process.exit(0); }
need();
if (cmd === 'seal') {
  const all = fs.readdirSync(WORK, { withFileTypes: true }).filter((e) => e.isDirectory() && !SKIP.has(e.name)).map((e) => e.name).concat('_sets');
  for (const n of names.length ? names : all) seal(n);
} else if (cmd === 'open') {
  for (const n of names.length ? names : fs.readdirSync(VAULT).filter((f) => f.endsWith('.enc')).map((f) => f.replace(/\.enc$/, ''))) open(n);
} else { console.error('usage: node tools/studio/vault.js seal|open|list [<name> ...]'); process.exit(1); }
