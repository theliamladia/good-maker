// Screenshot a page at desktop and phone width and report problems.
//   node tools/dev/check.js <path> [base=http://localhost:8798] [--signed-out] [--wait=ms]
// Writes tools/studio/work/check/<name>-1440.png and -390.png (full page) and prints page
// errors, failed requests and horizontal overflow (anything wider than the viewport).
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith('--')), [p, base = 'http://localhost:8798'] = args.filter((a) => !a.startsWith('--'));
const wait = +((flags.find((f) => f.startsWith('--wait=')) || '--wait=1200').split('=')[1]);
const OUT = path.join(__dirname, '..', 'studio', 'work', 'check'); fs.mkdirSync(OUT, { recursive: true });
const name = p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    if (!flags.includes('--signed-out')) await ctx.addCookies([{ name: 'good_sid', value: 'testsession_abcdefghijklmnop', url: base }]);
    const pg = await ctx.newPage(), errs = [];
    await pg.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => {
      const u = r.request().url();
      r.fulfill({ body: execFileSync('curl', ['-sL', '-A', 'Mozilla/5.0 Chrome/120', u], { maxBuffer: 64 << 20 }), contentType: u.includes('googleapis') ? 'text/css' : 'font/ttf' });
    });
    pg.on('pageerror', (e) => errs.push('JS ' + e.message));
    pg.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push(`${r.status()} ${r.url()}`); });
    await pg.goto(base + p, { waitUntil: 'networkidle' }).catch((e) => errs.push(e.message));
    await pg.waitForTimeout(wait);
    const wide = await pg.evaluate((vw) => {
      const clipped = (e) => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== 'visible') return true; } return false; };
      return [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > vw + 2 && getComputedStyle(e).position !== 'fixed' && !clipped(e))
      .slice(0, 6).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} → ${Math.round(e.getBoundingClientRect().right)}px`);
    }, w);
    const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
    const file = path.join(OUT, `${name}-${w}.png`);
    await pg.screenshot({ path: file, fullPage: true });
    console.log(`${w}px: ${file}\n  scrollWidth ${sw}${sw > w ? '  ← OVERFLOW' : ''}${wide.length ? '\n  wide: ' + wide.join(', ') : ''}${errs.length ? '\n  ' + errs.join('\n  ') : ''}`);
    await ctx.close();
  }
  await b.close();
})();
