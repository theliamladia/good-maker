// ART® IN MOTION: a white canvas that paints itself. Stains of the season's pigments
// bloom and bleed (layered wobbling washes, multiplied like watercolour), then brushes
// sweep across it (bristle by bristle, running dry), and the oldest paint slowly
// fades so the canvas never stops moving.
(() => {
  const cv = document.getElementById('paint');
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PAPER = '#fbfaf6';
  const PAINTS = ['#f3d88a', '#2e7d6b', '#a8203a', '#4a5560', '#9b4f96', '#3fb0c4'];
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const PAL = PAINTS.map(rgb);
  // Weighted: PAYNE'S GREY sparingly (it muddies the mix), GOOD® BLUE rarely.
  const W8 = [3, 3, 3, 1, 2, 3];
  const pick = () => { if (Math.random() < 0.04) return [0, 0, 255]; let r = Math.random() * W8.reduce((a, b) => a + b); for (let i = 0; i < PAL.length; i++) if ((r -= W8[i]) < 0) return PAL[i]; return PAL[0]; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  let W = 0, H = 0, dpr = 1;

  function size() {
    const old = W ? (() => { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); return c; })() : null;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    if (old) ctx.drawImage(old, 0, 0, old.width / dpr, old.height / dpr);
  }
  size();
  addEventListener('resize', size);

  // A smooth flow field (a few slow waves), steering the brushes.
  const flow = (x, y, t) => Math.sin(x * 0.0042 + t * 0.00031) + Math.sin(y * 0.0051 - t * 0.00023) + Math.sin((x + y) * 0.0029 + t * 0.00017);

  // ---------- Stains: watercolour blooms ----------
  const stains = [];
  function stain(t) {
    const R = rnd(60, 190) * Math.min(1.2, Math.max(0.6, W / 1200));
    stains.push({ x: rnd(-0.05, 1.05) * W, y: rnd(-0.05, 1.05) * H, R, c: pick(), born: t, life: rnd(1600, 2800), k: [rnd(0, 6.3), rnd(0, 6.3), rnd(0, 6.3)], amp: rnd(0.12, 0.28) });
  }
  function drawStain(s, t) {
    const a = Math.min(1, (t - s.born) / s.life);
    if (a >= 1) return false;
    const e = 1 - Math.pow(1 - a, 3);   // fast bloom, slow finish
    const r = s.R * (0.25 + 0.75 * e);
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const th = (i / 48) * Math.PI * 2;
      const w = 1 + s.amp * (Math.sin(th * 3 + s.k[0] + a * 1.3) * 0.5 + Math.sin(th * 5 + s.k[1] - a) * 0.3 + Math.sin(th * 9 + s.k[2]) * 0.2) + rnd(-0.06, 0.06);
      const x = s.x + Math.cos(th) * r * w, y = s.y + Math.sin(th) * r * w * 0.92;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    const [R, G, B] = s.c;
    ctx.fillStyle = `rgba(${R},${G},${B},${0.028 * (1 - a * 0.7)})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${R},${G},${B},0.03)`;   // pigment gathers at the wet edge
    ctx.lineWidth = 1;
    ctx.stroke();
    return true;
  }

  // ---------- Brushes: bristles that run dry ----------
  const brushes = [];
  function brush(t) {
    const fromLeft = Math.random() < 0.5;
    const n = (rnd(22, 34)) | 0;
    brushes.push({
      x: fromLeft ? rnd(-0.1, 0.3) * W : rnd(0.7, 1.1) * W, y: rnd(0.05, 0.95) * H,
      a: (fromLeft ? 0 : Math.PI) + rnd(-0.6, 0.6),
      v: rnd(3, 5.5), w: rnd(38, 110) * Math.min(1.2, Math.max(0.7, W / 1200)),
      c: pick(), age: 0, life: (rnd(180, 340)) | 0,
      bristles: Array.from({ length: n }, (_, i) => ({ o: (i / (n - 1)) - 0.5 + rnd(-0.01, 0.01), ink: rnd(0.15, 0.6), dry: rnd(0.3, 1) })),
      turn: rnd(0.003, 0.009) * (Math.random() < 0.5 ? -1 : 1), born: t,
    });
  }
  function drawBrush(b, t) {
    if (b.age++ > b.life) return false;
    const p = b.age / b.life;
    const load = 1 - p;                                        // paint left on the brush
    // The brush lands (width grows in) and lifts (paint thins out), never coming to a point.
    const taper = 0.55 + 0.45 * Math.min(1, b.age / 18);
    const lift = Math.min(1, (b.life - b.age) / 40);
    b.a += flow(b.x, b.y, t) * b.turn;
    const nx = b.x + Math.cos(b.a) * b.v, ny = b.y + Math.sin(b.a) * b.v;
    const px = -Math.sin(b.a), py = Math.cos(b.a);
    const [R, G, B] = b.c;
    ctx.lineCap = 'round';
    for (const s of b.bristles) {
      if (load < 1 - s.dry && Math.random() < 0.7) continue;   // dry bristles skip: broken, scratchy marks
      const off = s.o * b.w * taper + rnd(-0.4, 0.4);
      ctx.strokeStyle = `rgba(${R},${G},${B},${s.ink * (0.2 + 0.8 * load) * 0.32 * lift})`;
      ctx.lineWidth = Math.max(0.7, (b.w / b.bristles.length) * 1.8 * taper);
      ctx.beginPath();
      ctx.moveTo(b.x + px * off, b.y + py * off);
      ctx.lineTo(nx + px * off, ny + py * off);
      ctx.stroke();
    }
    b.x = nx; b.y = ny;
    return b.x > -200 && b.x < W + 200 && b.y > -200 && b.y < H + 200;
  }

  // ---------- The loop ----------
  let start = null, lastStain = 0, lastBrush = 0;
  function step(t) {
    if (start === null) start = t;
    const e = t - start;
    // Stains tint the canvas (laid over, so stacked washes keep their colour);
    // brush paint multiplies, so crossing strokes mix like glazes.
    ctx.globalCompositeOperation = 'source-over';
    // Stains first (a burst, then now and then); brushes from 1.4s on.
    if (e < 2400 ? e - lastStain > 340 : e - lastStain > 3400) { stain(t); lastStain = e; }
    if (e > 1400 && brushes.length < 4 && e - lastBrush > rnd(380, 900)) { brush(t); lastBrush = e; }
    for (let i = stains.length - 1; i >= 0; i--) if (!drawStain(stains[i], t)) stains.splice(i, 1);
    ctx.globalCompositeOperation = 'multiply';
    for (let i = brushes.length - 1; i >= 0; i--) if (!drawBrush(brushes[i], t)) brushes.splice(i, 1);
    ctx.globalCompositeOperation = 'source-over';
    // The canvas keeps moving: new paint arrives while the oldest slowly fades back to white.
    if (e > 6000) { ctx.fillStyle = 'rgba(251,250,246,0.008)'; ctx.fillRect(0, 0, W, H); }
  }

  const show = () => document.body.classList.add('shown');
  if (reduce) {
    // One still composition, no motion.
    for (let i = 0; i < 520; i++) step(i * 16);
    show();
    return;
  }
  setTimeout(show, 2200);
  let running = true;
  function loop(t) { if (running) step(t); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
})();
