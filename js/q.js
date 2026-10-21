// Q&G® (/q): GOOD® AND ROYALS. A fake break-in on black, then the title cards (GOOD®, AND,
// ROYALS) filling the screen top to bottom, then the page. The looks come sealed from
// /api/outfit and are drawn straight to canvas as turntables, like WANDERING®.
(() => {
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const C = { 'ONYX™': '#17171a', 'ROYAL™': '#12235c', 'PEARL™': '#ebe8e1', 'GRAPHITE™': '#3e3f44', 'ASH™': '#8e9096', 'SILVER™': '#cfd2d6', 'GOLD™': '#d8b23c' };
  const dots = (cw) => `<span class="qg-dots">${cw.split('/').map((n) => `<i style="background:${C[n] || '#000'}"></i>`).join('')}</span>`;

  // ---------- the boot ----------
  let skipped = false;
  const log = $('log');
  const line = (html) => { const d = document.createElement('div'); d.innerHTML = html; log.append(d); while (log.children.length > 60) log.firstChild.remove(); return d; };
  const hex = () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')).join(' ');
  const progress = (p) => { $('bar').style.setProperty('--p', `${p}%`); $('pct').textContent = `${Math.round(p)}%`; };
  const STEPS = [
    ['GOOD® OS 2.6 · COLD BOOT', 300],
    ['&gt; ROUTE good.leems.me :443 ', 380, 'ok'],
    ['&gt; HANDSHAKE ROYALS NODE ', 420, 'ok'],
    ['&gt; KEY EXCHANGE AES-256-GCM ', 440, 'ok'],
    ['&gt; FIREWALL /royals/vault ', 560, 'no', 'DENIED'],
    ['&gt; RETRY WITH GOOD® CREDENTIALS ', 460, 'ok'],
    ['&gt; DECRYPT q/manifest.enc ', 520, 'ok'],
    ['&gt; MOUNT Q&amp;G® ', 420, 'ok'],
  ];
  async function boot() {
    let p = 0;
    for (const [text, ms, kind, word] of STEPS) {
      if (skipped) return;
      const d = line(text);
      for (let i = 0; i < 3; i++) { line(`<span class="dim">${hex()}</span>`); await wait(ms / 4); }
      if (kind) d.innerHTML += `<span class="${kind}">${kind === 'ok' ? '[ OK ]' : `[ ${word} ]`}</span>`;
      p += 100 / STEPS.length; progress(Math.min(99, p + Math.random() * 4));
      await wait(ms / 4);
    }
    progress(100); line('<span class="ok">ACCESS GRANTED</span>'); await wait(380);
  }

  // ---------- the title cards: ink fills the screen from top to bottom ----------
  const cv = $('card'), cx = cv.getContext('2d');
  const FONT = '"Noto Serif JP", "Times New Roman", serif';
  function card(word, mark) {
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
    cx.font = `900 100px ${FONT}`; cx.textBaseline = 'alphabetic';
    const m = cx.measureText(word), ink = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const ink_w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const s = H / ink;                                       // cap height = the full height of the screen
    const mk = mark ? 0.16 : 0;                              // room for the ® at the top right
    const sx = Math.min(1, (W * 0.96) / (ink_w * s * (1 + mk)));   // compressed to fit across, like a title card
    const w = ink_w * s * sx;
    const x0 = (W - w * (1 + mk)) / 2;
    cx.save(); cx.translate(x0 + m.actualBoundingBoxLeft * s * sx, m.actualBoundingBoxAscent * s); cx.scale(s * sx, s);
    cx.fillStyle = '#fff'; cx.fillText(word, 0, 0); cx.restore();
    if (mark) { cx.font = `900 ${Math.round(H * 0.16)}px ${FONT}`; cx.fillStyle = '#fff'; cx.textBaseline = 'top'; cx.fillText('®', x0 + w + 8, 0); }
  }
  async function cards() {
    await Promise.race([document.fonts.load(`900 100px ${FONT}`, 'GOODANDROYALS'), wait(1500)]).catch(() => {});
    cv.classList.add('on');
    const flash = async () => { cv.classList.add('flash'); cx.clearRect(0, 0, cv.width, cv.height); await wait(60); cv.classList.remove('flash'); };
    for (const [w, mark, ms] of [['GOOD', true, 1000], ['AND', false, 520], ['ROYALS', false, 1000]]) {
      if (skipped) return;
      await flash(); card(w, mark); await wait(ms);
    }
    await flash();
  }
  function done() {
    $('boot').hidden = true; cv.classList.remove('on'); document.body.classList.remove('booting');
    try { sessionStorage.setItem('qg-seen', '1'); } catch {}
  }
  const skip = () => { if (skipped) return; skipped = true; done(); };
  $('skip').onclick = skip;
  addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); });
  cv.addEventListener('click', skip);
  if (reduce) done();
  else (async () => { await boot(); if (!skipped) await cards(); if (!skipped) done(); skipped = true; })();

  // ---------- the looks: sealed, scrambled, straight to canvas ----------
  const LOOKS = [
    ['FENCING JACKET® · FENCING TROUSER®', 'ONYX™/SILVER™'],
    ['FENCING JACKET® · FENCING TROUSER®', 'ROYAL™/SILVER™'],
    ['CLASP JACKET® · BIKER PANT®', 'PEARL™/GOLD™'],
    ['CLASP JACKET® · STUDDED BIKER PANT®', 'ONYX™/SILVER™'],
    ['BABY® CROPPED JACKET · FENCING TROUSER®', 'ONYX™/PEARL™'],
    ['BABY® CROPPED JACKET · BIKER PANT®', 'PEARL™/ONYX™'],
  ];
  $('looks').replaceChildren(...LOOKS.map(([pieces, cw], i) => {
    const f = document.createElement('figure');
    f.dataset.id = `qg-${i + 1}`;
    f.innerHTML = `<div class="n">${String(i + 1).padStart(2, '0')}<b>LOOK</b></div><canvas width="202" height="407" aria-hidden="true"></canvas><figcaption><span></span><span>${dots(cw)}${cw}</span></figcaption>`;
    f.querySelector('figcaption span').textContent = pieces;
    f.setAttribute('aria-label', `Look ${i + 1}: ${pieces}, ${cw}`);
    return f;
  }));
  const PIECES = [
    ['FENCING JACKET®', ['ONYX™/SILVER™', 'ROYAL™/SILVER™', 'PEARL™/GOLD™']],
    ['FENCING TROUSER®', ['ONYX™/SILVER™', 'ROYAL™/SILVER™', 'GRAPHITE™/SILVER™']],
    ['CLASP JACKET®', ['ONYX™/SILVER™', 'ROYAL™/SILVER™', 'PEARL™/GOLD™']],
    ['BABY® CROPPED JACKET', ['ONYX™/PEARL™', 'PEARL™/ONYX™']],
    ['BIKER PANT®', ['ONYX™/GRAPHITE™', 'GRAPHITE™/ASH™']],
    ['STUDDED BIKER PANT®', ['ONYX™/SILVER™']],
    ['G PENDANT®', ['SILVER™']],
    ['WALLET CHAIN®', ['SILVER™']],
  ];
  $('pieces').replaceChildren(...PIECES.map(([name, cws], i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${String(i + 1).padStart(2, '0')}</td><td></td><td>${cws.map((c) => `<span class="cw">${dots(c)}${c}</span>`).join('')}</td>`;
    tr.children[1].textContent = name;
    return tr;
  }));

  const scrambled = async (id, tries = 3) => {
    const r = await fetch(`api/outfit?id=${id}`, { cache: 'no-store' }).catch(() => null);
    if (!r || !r.ok) {
      if (tries > 1 && (!r || r.status >= 500)) { await wait(800); return scrambled(id, tries - 1); }
      throw new Error('unavailable');
    }
    const { k, d } = await r.json();
    const kb = Uint8Array.from(atob(k), (ch) => ch.charCodeAt(0));
    return createImageBitmap(new Blob([Uint8Array.from(atob(d), (ch, i) => ch.charCodeAt(0) ^ kb[i % kb.length])]));
  };
  const FW = 202, FH = 407, FRAMES = 24, STEP = 260;
  const shown = new Set(), spinners = [];
  const still = (c, id) => scrambled(id).then((bmp) => {
    if (c.dataset.spin) { bmp.close(); return; }
    c.getContext('2d').drawImage(bmp, 0, 0, FW, FH); bmp.close();
  }).catch(() => {});
  const turntable = (c, id) => {
    if (c.dataset.asked) return; c.dataset.asked = '1';
    scrambled(id.replace(/^qg-/, 'qg-spin-')).then((sheet) => { c.dataset.spin = '1'; spinners.push({ c, sheet, off: spinners.length * 4, drag: 0, drawn: -1 }); }).catch(() => {});
  };
  const near = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { shown.add(e.target); turntable(e.target, e.target.dataset.look); } else shown.delete(e.target);
  }), { rootMargin: '600px 0px' });
  const spin = (now) => {
    const auto = reduce ? 0 : Math.floor(now / STEP);
    for (const s of spinners) {
      if (!shown.has(s.c)) continue;
      const k = (((auto + s.off + s.drag) % FRAMES) + FRAMES) % FRAMES;
      if (k === s.drawn) continue;
      s.drawn = k;
      const x = s.c.getContext('2d'); x.clearRect(0, 0, FW, FH); x.drawImage(s.sheet, k * FW, 0, FW, FH, 0, 0, FW, FH);
    }
    requestAnimationFrame(spin);
  };
  requestAnimationFrame(spin);
  document.querySelectorAll('.qg-looks figure').forEach((fig) => {
    const c = fig.querySelector('canvas');
    c.dataset.look = fig.dataset.id; c.addEventListener('contextmenu', (e) => e.preventDefault());
    still(c, fig.dataset.id); near.observe(c);
    let x0 = null, d0 = 0, sp = null;
    fig.addEventListener('pointerdown', (e) => {
      sp = spinners.find((s) => s.c === c); if (!sp) return;
      x0 = e.clientX; d0 = sp.drag; fig.setPointerCapture(e.pointerId); fig.classList.add('turning');
    });
    fig.addEventListener('pointermove', (e) => { if (x0 !== null && sp) sp.drag = d0 + Math.round((e.clientX - x0) / 10); });
    const up = () => { x0 = null; fig.classList.remove('turning'); };
    fig.addEventListener('pointerup', up); fig.addEventListener('pointercancel', up);
  });
})();
