// Render a set with the GOOD® studio (tools/studio/studio.html). Serves the repo itself.
//   node tools/studio/render.js shoot <set>          models in outfits    -> work/out/<set>/<id>.png
//   node tools/studio/render.js raw   <set>          models + raw texture -> work/out/<set>/<id>.png
//   node tools/studio/render.js spin  <set> [n=24]   turntable frames     -> work/out/<set>/<id>-NN.png
//   node tools/studio/render.js ghost <set>          garments alone       -> work/out/<set>/<id>.png
// A set is work/<set>.json: an array of entries. shoot/raw/spin entries:
//   { id, skin, topFile, pantsFile, accFile?, untucked?, rawFile?, pose?: { turn, ra, la, rl, ll }, w?, h?, zoom? }
// ghost entries: { id, f: 'work/…/x.png', kind: 'top'|'bottom'|'topback', slim? }
// Paths in entries are relative to tools/studio/. Run setup.sh once first.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), STUDIO = '/tools/studio/';
const [mode, set, nArg] = process.argv.slice(2);
if (!['shoot', 'raw', 'spin', 'ghost'].includes(mode) || !set) { console.error('usage: node render.js shoot|raw|spin|ghost <set> [frames]'); process.exit(1); }
const L = JSON.parse(fs.readFileSync(path.join(__dirname, 'work', set + '.json'), 'utf8'));
const OUT = path.join(__dirname, 'work', 'out', set); fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
}).listen(0, async () => {
  const base = `http://127.0.0.1:${srv.address().port}${STUDIO}studio.html`;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (let i = 0; i < L.length; i++) {
    const e = L[i], id = e.id || String(i);
    const w = mode === 'ghost' ? 700 : e.w || 420, h = mode === 'ghost' ? 700 : e.h || 640;
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', (er) => console.log('ERR', id, er.message));
    const url = mode === 'ghost' ? `${base}?mode=ghost&f=${encodeURIComponent(e.f)}&kind=${e.kind || 'top'}&slim=${e.slim ? 1 : 0}`
      : `${base}?mode=${mode === 'raw' ? 'raw' : 'shoot'}&set=${set}&i=${i}`;
    await p.goto(url); await p.waitForFunction(() => window.done, null, { timeout: 30000 });
    const done = await p.evaluate(() => window.done);
    if (done.error) { console.log('ERR', id, done.error); await p.close(); continue; }
    if (mode === 'spin') {
      const n = +(nArg || 24);
      for (let f = 0; f < n; f++) {
        const u = await p.evaluate((deg) => window.spin(deg), (f * 360) / n);
        fs.writeFileSync(path.join(OUT, `${id}-${String(f).padStart(2, '0')}.png`), Buffer.from(u.split(',')[1], 'base64'));
      }
    } else {
      await p.waitForTimeout(150);
      await p.screenshot({ path: path.join(OUT, `${id}.png`), omitBackground: true });
    }
    console.log(id, JSON.stringify(done));
    await p.close();
  }
  await b.close(); srv.close();
});
