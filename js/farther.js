// FARTHER® (/farther): start over a square sun, pull out past the square planets (MERCURY to SATURN),
// then faster through galaxies and black holes, and come down over a GOOD® BLUE planet with white land.
// Everything is drawn on one canvas: planets are small pixel textures drawn as spinning squares, the
// camera follows keyframes (position, view height on a log scale, a slow roll), and the stars are a
// screen-space field that streaks when the camera moves fast. SKIP / Esc / Enter / Space jumps to the end.
(() => {
  const cv = document.getElementById('space'), ctx = cv.getContext('2d');
  const title = document.getElementById('title'), skip = document.getElementById('skip');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, DPR = 1;
  function size() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  size(); addEventListener('resize', size);

  // ---------- noise ----------
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const lerp = (a, b, k) => a + (b - a) * k;
  function vnoise(x, y, s, period) {   // value noise, wraps every `period` cells on x
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const w = (n) => ((n % period) + period) % period;
    const a = hash(w(xi), yi, s), b = hash(w(xi + 1), yi, s), c = hash(w(xi), yi + 1, s), d = hash(w(xi + 1), yi + 1, s);
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
  }
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

  // ---------- planet textures (N×N pixels, redrawn each frame they're on screen) ----------
  function texture(N, paint) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), img = x.createImageData(N, N);
    return { c, N, draw(t) {
      const d = img.data;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const p = paint(i, j, t, N), k = (j * N + i) * 4;
        d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = 255;
      }
      x.putImageData(img, 0, 0);
    } };
  }
  const limb = (p, i, j, N) => { const dx = (i + .5) / N - .5, dy = (j + .5) / N - .5; const k = 1 - Math.min(.35, (dx * dx + dy * dy) * .9); return [p[0] * k, p[1] * k, p[2] * k]; };
  const bands = (cols, speed, wob, seed) => (i, j, t, N) => {
    const n = vnoise(i / 3 + t * speed, j / 2, seed, Math.ceil(N / 3));
    const b = (j / N) * cols.length + (n - .5) * wob; const k = Math.max(0, Math.min(cols.length - 1, Math.floor(b)));
    return limb(cols[k], i, j, N);
  };
  const P = {
    sun: texture(20, (i, j, t, N) => {
      const n = vnoise(i / 2.5 + t * .6, j / 2.5 - t * .3, 3, 8) * .6 + vnoise(i / 1.2 - t * 1.4, j / 1.2, 9, 17) * .4;
      return mix(rgb('#ff7a12'), rgb('#ffe27a'), Math.min(1, Math.max(0, n * 1.3 - .1)));
    }),
    mercury: texture(10, (i, j, t, N) => { const n = vnoise(i / 1.6 + t * .2, j / 1.6, 21, 7); return limb(mix(rgb('#6e6a66'), rgb('#b9b3ab'), n > .62 ? .2 : n), i, j, N); }),
    venus: texture(12, bands([rgb('#e9d6a5'), rgb('#d8bd83'), rgb('#efe0b6'), rgb('#c9a96c'), rgb('#e6cf98')], .25, 1.6, 31)),
    earth: texture(14, (i, j, t, N) => {
      const land = vnoise(i / 2.6 + t * .35, j / 2.6, 41, 6) > .56, cloud = vnoise(i / 2 + t * .6, j / 2.4, 47, 7) > .7;
      const pole = j === 0 || j === N - 1;
      return limb(cloud || pole ? rgb('#f4f6f8') : land ? rgb('#3f8f4a') : rgb('#1f5fd1'), i, j, N);
    }),
    moon: texture(6, (i, j, t, N) => limb(vnoise(i, j, 51, 6) > .6 ? rgb('#8d8b88') : rgb('#c9c7c2'), i, j, N)),
    mars: texture(12, (i, j, t, N) => {
      if (j === 0) return rgb('#f1ece6');
      const n = vnoise(i / 2.2 + t * .3, j / 2.2, 61, 6);
      return limb(n > .6 ? rgb('#7e3418') : n > .4 ? rgb('#b8522a') : rgb('#cf6a3c'), i, j, N);
    }),
    jupiter: (() => { const base = bands([rgb('#d9c3a0'), rgb('#b08454'), rgb('#e8d8bd'), rgb('#9c6b40'), rgb('#e2ccaa'), rgb('#b88c5c'), rgb('#d7c09c')], .45, 1.2, 71);
      return texture(24, (i, j, t, N) => { const sx = ((Math.floor(t * 4) + 6) % N); const spot = j >= 14 && j <= 16 && ((i - sx + N) % N) < 4; return spot ? limb(rgb('#c0492b'), i, j, N) : base(i, j, t, N); }); })(),
    saturn: texture(20, bands([rgb('#e8d39a'), rgb('#cfb072'), rgb('#efe0b3'), rgb('#c4a262'), rgb('#e5cd92')], .35, 1, 81)),
    blackhole: texture(16, (i, j, t, N) => {
      const cx = i + .5 - N / 2, cy = j + .5 - N / 2, r = Math.max(Math.abs(cx), Math.abs(cy));
      if (r < 4.2) return [0, 0, 0];
      const a = Math.atan2(cy, cx) + t * 1.6, glow = Math.max(0, 1 - (r - 4.2) / 4);
      const sw = .5 + .5 * Math.sin(a * 3 + r);
      return mix([8, 6, 14], mix(rgb('#ff8a2a'), rgb('#fff1c2'), sw), glow * (.6 + .4 * sw));
    }),
    good: texture(40, (i, j, t, N) => {
      const n = vnoise(i / 5 + t * .08, j / 5, 101, 8) * .7 + vnoise(i / 2 + t * .08 * 2.5, j / 2, 107, 20) * .3;
      const cloud = vnoise(i / 3 + t * .14, j / 4, 113, 14) > .74;
      const edge = Math.min(i, j, N - 1 - i, N - 1 - j);            // a border of water all round: no land or cloud
      if (edge < 3) return limb([0, 0, 255], i, j, N);               // in the outer three pixels
      return limb(cloud ? [235, 238, 255] : n > .57 ? [255, 255, 255] : [0, 0, 255], i, j, N);
    }),
  };

  // ---------- the world ----------
  // x, y and size in world units; spin in rad/s; glow = halo colour.
  const SUN = { x: 0, y: 0, s: 200, tex: P.sun, spin: .05, glow: 'rgba(255,170,40,' };
  const BODIES = [
    SUN,
    { x: 400, y: 0, s: 18, tex: P.mercury, spin: .3 },
    { x: 700, y: 0, s: 28, tex: P.venus, spin: -.15 },
    { x: 1050, y: 0, s: 30, tex: P.earth, spin: .2, moon: true },
    { x: 1450, y: 0, s: 22, tex: P.mars, spin: .25 },
    { x: 2400, y: 0, s: 140, tex: P.jupiter, spin: .08 },
    { x: 3700, y: 0, s: 110, tex: P.saturn, spin: .06, ring: true },
    { x: 52000, y: 0, s: 4200, tex: P.blackhole, spin: .2, glow: 'rgba(255,140,40,' },
    { x: 80000, y: 0, s: 6000, tex: P.blackhole, spin: -.15, glow: 'rgba(255,190,90,' },
  ];
  const GOOD = { x: 140000, y: 0, s: 3000, tex: P.good, spin: 0, glow: 'rgba(40,60,255,' };
  BODIES.push(GOOD);
  // galaxies: a spiral of pixel squares
  const GALAXIES = [{ x: 14000, y: 0, s: 7000, rot: .4, seed: 5, hue: ['#cfd8ff', '#ffd6f0', '#ffffff'] }, { x: 30000, y: 0, s: 10000, rot: -.25, seed: 9, hue: ['#ffe3b8', '#bcd2ff', '#ffffff'] }];
  for (const g of GALAXIES) {
    g.pts = [];
    for (let k = 0; k < 520; k++) {
      const arm = k % 3, d = Math.pow(hash(k, 1, g.seed), .7), a = arm * 2.094 + d * 5.2 + (hash(k, 2, g.seed) - .5) * .7;
      g.pts.push({ d: d * .5, a, c: g.hue[k % 3], sz: hash(k, 3, g.seed) < .1 ? 2 : 1 });
    }
  }

  // ---------- the camera ----------
  // Everything sits on one line. The camera travels out along it in one continuous move: steady through
  // the planets, then faster through the galaxies and black holes, easing in over the GOOD® planet. The
  // view widens with the distance travelled (a smooth zoom out), and the path bows gently off the line
  // with a little roll (the slight curve), then settles level over the planet.
  const END = 16, X0 = 300, XN = GOOD.x;
  const L0 = Math.log(X0), L1 = Math.log(XN + X0);
  const SPLIT = .6, AT = (Math.log(3700 + X0) - L0) / (L1 - L0);           // Saturn is passed at 60% of the time
  function along(s) {   // 0..1 of the log distance, steady first, then a Hermite run that speeds up and settles
    if (s <= SPLIT) return AT * s / SPLIT;
    const q = (s - SPLIT) / (1 - SPLIT), m0 = (AT / SPLIT) * (1 - SPLIT) / (1 - AT);
    return AT + (1 - AT) * ((q * q * q - 2 * q * q + q) * m0 + (-2 * q * q * q + 3 * q * q));
  }
  const smooth = (e0, e1, x) => { const k = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
  function cam(t) {
    const s = Math.min(1, t / END), x = Math.exp(lerp(L0, L1, along(s))) - X0;
    const vOut = 240 + .5 * x, land = smooth(.86, 1, s);
    const v = Math.exp(lerp(Math.log(vOut), Math.log(2400), land));
    const bow = Math.sin(Math.PI * Math.min(1, s / .9));
    const y = lerp(-.12 * vOut * bow, -1740, land), r = .07 * bow * (1 - land);
    return { x, y, v, r };
  }

  // ---------- stars (screen space, relative to the centre) ----------
  const STARS = Array.from({ length: 360 }, (_, k) => ({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, d: .15 + Math.random() * .85, b: .3 + Math.random() * .7 }));
  let prev = null;
  function stars(c) {
    const R = Math.max(W, H);
    const k = prev ? prev.v / c.v : 1, dr = prev ? c.r - prev.r : 0;
    const px = prev ? ((c.x - prev.x) / c.v) * H : 0, py = prev ? ((c.y - prev.y) / c.v) * H : 0;
    for (const s of STARS) {
      let x = s.x * R, y = s.y * R; const ox = x, oy = y;
      const z = Math.pow(k, s.d * .35);                           // zooming out pulls them in, gently
      x *= z; y *= z;
      const cs = Math.cos(-dr), sn = Math.sin(-dr); [x, y] = [x * cs - y * sn, x * sn + y * cs];
      x -= px * s.d * .25; y -= py * s.d * .25;
      const moved = Math.hypot(x - ox, y - oy);
      ctx.strokeStyle = ctx.fillStyle = `rgba(255,255,255,${s.b})`;
      if (moved > 2.5) { ctx.lineWidth = s.d * 1.6; ctx.beginPath(); ctx.moveTo(W / 2 + ox, H / 2 + oy); ctx.lineTo(W / 2 + x, H / 2 + y); ctx.stroke(); }
      else { const q = s.d > .8 ? 2 : 1; ctx.fillRect(Math.round(W / 2 + x), Math.round(H / 2 + y), q, q); }
      s.x = x / R; s.y = y / R;
      if (Math.abs(s.x) > .75 || Math.abs(s.y) > .75 || Math.hypot(s.x, s.y) < .01) { s.x = (Math.random() - .5) * 1.5; s.y = (Math.random() - .5) * 1.5; }
    }
    prev = c;
  }

  // ---------- draw ----------
  function toScreen(c, x, y) {
    const sc = H / c.v, dx = (x - c.x) * sc, dy = (y - c.y) * sc, cs = Math.cos(c.r), sn = Math.sin(c.r);
    return [W / 2 + dx * cs - dy * sn, H / 2 + dx * sn + dy * cs, sc];
  }
  function body(c, b, t) {
    const [X, Y, sc] = toScreen(c, b.x, b.y), S = b.s * sc;
    if (S < .6 || X < -S * 2 || X > W + S * 2 || Y < -S * 2 || Y > H + S * 2) return;
    if (b.glow) {
      const g = ctx.createRadialGradient(X, Y, S * .3, X, Y, S * 1.6);
      g.addColorStop(0, b.glow + '.45)'); g.addColorStop(1, b.glow + '0)');
      ctx.fillStyle = g; ctx.fillRect(X - S * 1.6, Y - S * 1.6, S * 3.2, S * 3.2);
    }
    b.tex.draw(t);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(c.r + t * b.spin);
    if (b.ring) {   // Saturn: a square ring, seen at a tilt
      ctx.save(); ctx.scale(1, .22);
      ctx.strokeStyle = 'rgba(232,211,154,.85)'; ctx.lineWidth = Math.max(1, S * .07);
      ctx.strokeRect(-S * 1.05, -S * 1.05, S * 2.1, S * 2.1); ctx.restore();
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(b.tex.c, -S / 2, -S / 2, S, S);
    if (b.ring) {   // the front half of the ring over the planet
      ctx.save(); ctx.beginPath(); ctx.rect(-S * 2, 0, S * 4, S * 2); ctx.clip(); ctx.scale(1, .22);
      ctx.strokeStyle = 'rgba(232,211,154,.95)'; ctx.lineWidth = Math.max(1, S * .07); ctx.strokeRect(-S * 1.05, -S * 1.05, S * 2.1, S * 2.1); ctx.restore();
    }
    ctx.restore();
    if (b.moon) {   // Earth's moon, on a square orbit
      const a = t * 1.2, o = b.s * 1.1;
      const [mx, my] = toScreen(c, b.x + Math.cos(a) * o, b.y + Math.sin(a) * o), m = b.s * .28 * sc;
      P.moon.draw(t); ctx.save(); ctx.translate(mx, my); ctx.rotate(c.r + t * .4); ctx.drawImage(P.moon.c, -m / 2, -m / 2, m, m); ctx.restore();
    }
  }
  function galaxy(c, g, t) {
    const [X, Y, sc] = toScreen(c, g.x, g.y), S = g.s * sc;
    if (S < 4 || X < -S || X > W + S || Y < -S || Y > H + S) return;
    const core = ctx.createRadialGradient(X, Y, 0, X, Y, S * .18);
    core.addColorStop(0, 'rgba(255,245,230,.9)'); core.addColorStop(1, 'rgba(255,245,230,0)');
    ctx.fillStyle = core; ctx.fillRect(X - S * .2, Y - S * .2, S * .4, S * .4);
    const rot = c.r + g.rot + t * .12;
    for (const p of g.pts) {
      const a = p.a + rot, r = p.d * S;
      ctx.fillStyle = p.c; ctx.globalAlpha = .55 + .45 * (1 - p.d * 2);
      const q = Math.max(1, p.sz * Math.min(3, S / 400));
      ctx.fillRect(Math.round(X + Math.cos(a) * r), Math.round(Y + Math.sin(a) * r * .55), q, q);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- run ----------
  let t0 = null, jumped = reduce, shown = false;
  function finish() {
    if (shown) return; shown = true;
    title.classList.add('on'); document.body.classList.add('fr-done'); skip.hidden = true;
  }
  function frame(now) {
    if (t0 === null) t0 = now;
    if (jumped) { if ((now - t0) / 1000 < END) t0 = now - END * 1000; jumped = false; }   // straight to the end, still turning
    const t = (now - t0) / 1000;
    const c = cam(Math.min(t, END));
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
    // the deep-space wash, bluer as we go
    const deep = Math.min(1, t / END), g = ctx.createRadialGradient(W * .7, H * 1.1, 0, W * .7, H * 1.1, Math.max(W, H));
    g.addColorStop(0, `rgba(20,30,${90 + 120 * deep},${.25 + .2 * deep})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stars(c);
    for (const gx of GALAXIES) galaxy(c, gx, t);
    for (const b of BODIES) body(c, b, t);
    if (t >= END - .2) finish();
    requestAnimationFrame(frame);
  }
  const jump = () => { jumped = true; prev = null; };
  skip.onclick = jump;
  addEventListener('keydown', (e) => { if (['Escape', 'Enter', ' '].includes(e.key) && !shown) { e.preventDefault(); jump(); } });
  document.fonts.ready.then(() => requestAnimationFrame(frame));
})();
