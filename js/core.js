// CORE® (/core). The mark: five squares that line up across, then down, then on the diagonal,
// then settle into the cross; the name and the copy follow. Then the pieces, as sealed
// turntables (drawn to canvas from /api/outfit's scrambled data, never an image URL).
(() => {
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- the mark ----------
  // Grid positions (x, y) on a 5×5 board for each square, per shape. Square 2 is the centre throughout.
  const SHAPES = {
    across: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
    down: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
    diagonal: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]],
    cross: [[1, 2], [2, 1], [2, 2], [2, 3], [3, 2]],
  };
  const sq = [...$('mark').children];
  const shape = (name) => sq.forEach((el, i) => { el.style.setProperty('--x', SHAPES[name][i][0]); el.style.setProperty('--y', SHAPES[name][i][1]); });
  const hero = $('mark').closest('.co-hero');
  (async () => {
    if (reduce) { shape('cross'); $('mark').classList.add('on'); hero.classList.add('done'); return; }
    shape('across');
    await wait(250);
    sq.forEach((el, i) => setTimeout(() => el.style.cssText += ';opacity:1;transform:scale(1)', i * 110));
    await wait(1100);
    shape('down'); await wait(1050);
    shape('diagonal'); await wait(1050);
    shape('cross'); await wait(900);
    hero.classList.add('done');
  })();

  // ---------- the pieces ----------
  const C = { 'COTTON™': '#f4f4f2', 'STEEL™': '#a9c4e4', 'FLECK™': '#9a9ca3', 'OATMILK™': '#e7dcc8', 'INKWELL™': '#26272d', STONEWASH: '#7f9fca', 'HERRINGBONE™': '#6f6d6a', 'BROWN SUGAR OATMEAL™': '#c8ad88' };
  const LOOKS = [
    ['THE SHIRT® · 5-POCKET JEAN #3', ['COTTON™', 'STONEWASH']],
    ['OXFORD® · TROUSER®', ['STEEL™', 'HERRINGBONE™']],
    ['HOODIE® · 5-POCKET JEAN #3', ['FLECK™', 'STONEWASH']],
    ['OXFORD® · 5-POCKET JEAN #3', ['STEEL™', 'STONEWASH']],
    ['HOODIE® · TROUSER®', ['OATMILK™', 'BROWN SUGAR OATMEAL™']],
    ['HOODIE® · JORT #3', ['INKWELL™', 'STONEWASH']],
  ];
  $('looks').replaceChildren(...LOOKS.map(([pieces, cw], i) => {
    const f = document.createElement('figure'); f.dataset.id = `core-${i + 1}`;
    f.innerHTML = `<canvas width="202" height="407" aria-hidden="true"></canvas><figcaption><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="p"></span><p class="co-cw"><span class="co-dots">${cw.map((c) => `<i style="background:${C[c]}"></i>`).join('')}</span>${cw.join(' · ')}</p></figcaption>`;
    f.querySelector('.p').textContent = pieces;
    f.setAttribute('aria-label', `${pieces}, ${cw.join(' and ')}`);
    return f;
  }));

  // ---------- sealed turntables (from js/dynamics.js) ----------
  const scrambled = async (id, tries = 3) => {
    const r = await fetch(`/api/outfit?id=${id}`, { cache: 'no-store' }).catch(() => null);
    if (!r || !r.ok) {
      if (tries > 1 && (!r || r.status >= 500)) { await wait(800); return scrambled(id, tries - 1); }
      throw new Error('unavailable');
    }
    const { k, d } = await r.json();
    const kb = Uint8Array.from(atob(k), (ch) => ch.charCodeAt(0));
    return createImageBitmap(new Blob([Uint8Array.from(atob(d), (ch, i) => ch.charCodeAt(0) ^ kb[i % kb.length])]));
  };
  const FRAMES = 24, STEP = 260;
  const shown = new Set(), spinners = [];
  const still = (c, id) => scrambled(id).then((bmp) => { if (!c.dataset.spin) c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close(); }).catch(() => {});
  const turntable = (c, id) => {
    if (c.dataset.asked) return; c.dataset.asked = '1';
    scrambled(id.replace(/^core-/, 'core-spin-')).then((sheet) => { c.dataset.spin = '1'; spinners.push({ c, sheet, off: spinners.length * 4, drag: 0, drawn: -1 }); }).catch(() => {});
  };
  const near = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { shown.add(e.target); turntable(e.target, e.target.dataset.look); } else shown.delete(e.target);
  }), { rootMargin: '600px 0px' });
  const spin = (now) => {
    const auto = Math.floor(now / STEP);
    for (const s of spinners) {
      if (!shown.has(s.c)) continue;
      const k = (((auto + s.off + s.drag) % FRAMES) + FRAMES) % FRAMES;
      if (k === s.drawn) continue;
      s.drawn = k;
      const fw = s.sheet.width / FRAMES, x = s.c.getContext('2d'); x.clearRect(0, 0, s.c.width, s.c.height); x.drawImage(s.sheet, k * fw, 0, fw, s.sheet.height, 0, 0, s.c.width, s.c.height);
    }
    requestAnimationFrame(spin);
  };
  requestAnimationFrame(spin);
  document.querySelectorAll('.co-looks figure').forEach((fig) => {
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
