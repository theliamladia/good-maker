// Render an HTML page (sheet, press image, infographic) to PNG with Playwright.
//   node tools/studio/sheet.js <page.html> <out.png> [width=1600] [scale=1] [--clip=WxH]
// Google Fonts are fetched with curl and handed to the page (headless Chromium can't
// verify the proxy's certificate on its own), so the real fonts render, not fallbacks.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const path = require('path');
const [page, out, width = '1600', scale = '1', clip] = process.argv.slice(2);
if (!page || !out) { console.error('usage: node sheet.js <page.html> <out.png> [width] [scale] [--clip=WxH]'); process.exit(1); }
const curl = (url) => execFileSync('curl', ['-sL', '-A', 'Mozilla/5.0 Chrome/120', url], { maxBuffer: 64 << 20 });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const [cw, ch] = clip ? clip.replace('--clip=', '').split('x').map(Number) : [+width, 900];
  const p = await b.newPage({ viewport: { width: cw, height: ch }, deviceScaleFactor: +scale });
  await p.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => {
    const u = r.request().url();
    r.fulfill({ body: curl(u), contentType: u.includes('googleapis') ? 'text/css' : 'font/ttf' });
  });
  const url = /^https?:/.test(page) ? page : 'file://' + path.resolve(page);
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: out, fullPage: !clip });
  console.log('wrote', out);
  await b.close();
})();
