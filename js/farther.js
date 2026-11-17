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
  function size() { DPR = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
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
  const blackhole = (inner, outer, arms, speed) => texture(20, (i, j, t, N) => {
    const cx = i + .5 - N / 2, cy = j + .5 - N / 2, r = Math.max(Math.abs(cx), Math.abs(cy));
    if (r < 4.6) return [0, 0, 0];                                            // the event horizon
    if (r < 5.4) return rgb('#fff6dc');                                       // the photon ring
    const a = Math.atan2(cy, cx) + t * speed, glow = Math.max(0, 1 - (r - 5.4) / 5);
    const sw = .5 + .5 * Math.sin(a * arms + r * .9);
    return mix([6, 4, 12], mix(rgb(outer), rgb(inner), sw), glow * (.55 + .45 * sw));
  });
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
    good: texture(40, (i, j, t, N) => {
      const n = vnoise(i / 5 + t * .08, j / 5, 101, 8) * .7 + vnoise(i / 2 + t * .08 * 2.5, j / 2, 107, 20) * .3;
      const cloud = vnoise(i / 3 + t * .14, j / 4, 113, 14) > .74;
      const edge = Math.min(i, j, N - 1 - i, N - 1 - j);            // a border of water all round: no land or cloud
      if (edge < 3) return limb([0, 0, 255], i, j, N);               // in the outer three pixels
      return limb(cloud ? [235, 238, 255] : n > .57 ? [255, 255, 255] : [0, 0, 255], i, j, N);
    }),
  };

  // ---------- the world, first person ----------
  // Everything is lined up along the way out. The camera starts over the sun and flies straight back,
  // away from it: each body is behind the camera at first, comes past it, and then shrinks ahead,
  // one in front of the other. Depth z is distance from the sun; a body sits off the axis by
  // z·off in the direction ang, so it slides in from the edge of the frame as it passes.
  // Sizes are relative: galaxies and black holes dwarf the planets.
  const B = [];
  const add = (o) => (B.push(o), o);
  add({ kind: 'body', z: 0, s: 100, off: 0, ang: 0, tex: P.sun, spin: .05, glow: 'rgba(255,170,40,' });
  add({ kind: 'body', z: 150, s: 10, off: .14, ang: .3, tex: P.mercury, spin: .3 });
  add({ kind: 'body', z: 230, s: 17, off: .14, ang: 2.4, tex: P.venus, spin: -.15 });
  add({ kind: 'body', z: 340, s: 18, off: .13, ang: 4.2, tex: P.earth, spin: .2, moon: true });
  add({ kind: 'body', z: 500, s: 12, off: .13, ang: 5.6, tex: P.mars, spin: .25 });
  add({ kind: 'body', z: 850, s: 95, off: .16, ang: 1.1, tex: P.jupiter, spin: .08 });
  add({ kind: 'body', z: 1500, s: 80, off: .15, ang: 3.3, tex: P.saturn, spin: .06, ring: true });
  // galaxies: three kinds, each far bigger than anything before it
  const galaxy = (z, s, off, ang, type, cols, seed, tilt) => {
    const g = add({ kind: 'galaxy', z, s, off, ang, type, cols, tilt, pts: [] });
    for (let k = 0; k < 900; k++) {
      const h1 = hash(k, 1, seed), h2 = hash(k, 2, seed), h3 = hash(k, 3, seed);
      let d, a;
      if (type === 'elliptical') { d = Math.pow(h1, 1.8) * .5; a = h2 * Math.PI * 2; }
      else if (type === 'barred') {
        if (k % 4 === 0) { d = (h1 - .5) * .32; a = 0; }                                  // the bar
        else { const arm = k % 2; d = .14 + Math.pow(h1, .8) * .36; a = arm * Math.PI + (d - .14) * 7 + (h2 - .5) * .5; }
      } else { const arms = type === 'spiral4' ? 4 : 2; const arm = k % arms; d = Math.pow(h1, .7) * .5; a = arm * (Math.PI * 2 / arms) + d * 9 + (h2 - .5) * .6; }
      g.pts.push({ d, a, c: cols[k % cols.length], big: h3 < .08 });
    }
    return g;
  };
  galaxy(9000, 26000, .55, .8, 'spiral', ['#cfd8ff', '#9fb4ff', '#ffffff', '#ffd6f0'], 5, .55);
  add({ kind: 'body', z: 22000, s: 9000, off: .42, ang: 3.9, tex: blackhole('#fff1c2', '#ff8a2a', 3, 1.6), spin: .2, glow: 'rgba(255,140,40,' });
  galaxy(52000, 160000, .7, 2.6, 'elliptical', ['#ffe3b8', '#ffcf8a', '#fff4e0'], 9, .7);
  add({ kind: 'body', z: 110000, s: 70000, off: .5, ang: 5.5, tex: blackhole('#d9f2ff', '#5a6cff', 2, -1.2), spin: -.12, glow: 'rgba(90,110,255,' });
  galaxy(240000, 700000, .6, 4.6, 'barred', ['#ffd1e8', '#c9b8ff', '#ffffff'], 13, .5);
  add({ kind: 'body', z: 420000, s: 260000, off: .55, ang: 1.9, tex: blackhole('#ffe0f0', '#ff3d6e', 4, 2.1), spin: .1, glow: 'rgba(255,60,110,' });
  galaxy(700000, 2400000, .9, 3.2, 'spiral4', ['#bfffe8', '#9fdcff', '#ffffff'], 17, .6);
  const GOOD = add({ kind: 'body', z: 1200000, s: 60000, off: .08, ang: 2.2, tex: P.good, spin: 0, glow: 'rgba(40,60,255,', good: true });

  // ---------- the camera ----------
  // c = how far back from the sun. It grows on a log scale: steady through the planets, then faster
  // through the galaxies and black holes, then easing off. Over the last stretch the camera turns onto
  // the GOOD® planet and stops where the whole planet fills about half the frame, below the title.
  const END = 17;
  const F = () => H * .9;                                    // focal length in px
  const sideOf = (o) => [Math.cos(o.ang) * o.off * o.z, Math.sin(o.ang) * o.off * o.z];
  const [GX, GY] = sideOf(GOOD);
  const smooth = (e0, e1, x) => { const k = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
  function cEnd() { const target = .5 * Math.min(W, H); return GOOD.z + F() * GOOD.s / target; }
  function cam(t) {
    const s = Math.min(1, t / END), C0 = 115, C1 = cEnd();
    const L0 = Math.log(C0), L1 = Math.log(C1);
    const SP = .5, AT = (Math.log(2600) - L0) / (L1 - L0);                // past Saturn at half time
    let u;
    if (s <= SP) u = AT * s / SP;
    else { const q = (s - SP) / (1 - SP), m0 = (AT / SP) * (1 - SP) / (1 - AT); u = AT + (1 - AT) * ((q * q * q - 2 * q * q + q) * m0 + (-2 * q * q * q + 3 * q * q)); }
    const c = Math.exp(lerp(L0, L1, u));
    const turn = smooth(.78, 1, s), drop = (H * .12) * (c - GOOD.z) / F();   // planet sits a little low, under the title
    return { c, x: GX * turn, y: (GY - drop) * turn, r: .05 * Math.sin(Math.PI * s) * (1 - turn) };
  }

  // ---------- stars: they stream in towards the centre as we pull back ----------
  const STARS = Array.from({ length: 420 }, () => ({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, d: .2 + Math.random() * .8, b: .3 + Math.random() * .7 }));
  let prev = null;
  function stars(cm) {
    const R = Math.max(W, H), k = prev ? prev.c / cm.c : 1, dr = prev ? cm.r - prev.r : 0;
    for (const st of STARS) {
      let x = st.x * R, y = st.y * R; const ox = x, oy = y;
      const z = Math.pow(k, st.d * .6); x *= z; y *= z;
      const cs = Math.cos(-dr), sn = Math.sin(-dr); [x, y] = [x * cs - y * sn, x * sn + y * cs];
      const moved = Math.hypot(x - ox, y - oy);
      ctx.strokeStyle = ctx.fillStyle = `rgba(255,255,255,${st.b})`;
      if (moved > 2.5) { ctx.lineWidth = st.d * 1.6; ctx.beginPath(); ctx.moveTo(W / 2 + ox, H / 2 + oy); ctx.lineTo(W / 2 + x, H / 2 + y); ctx.stroke(); }
      else { const q = st.d > .8 ? 2 : 1; ctx.fillRect(Math.round(W / 2 + x), Math.round(H / 2 + y), q, q); }
      st.x = x / R; st.y = y / R;
      if (Math.hypot(st.x, st.y) < .02) { const a = Math.random() * Math.PI * 2, r = .55 + Math.random() * .25; st.x = Math.cos(a) * r; st.y = Math.sin(a) * r; }   // reborn at the edge
    }
    prev = cm;
  }

  // ---------- draw ----------
  function project(cm, o) {
    const d = cm.c - o.z; if (d <= 1) return null;                         // still behind us
    const [sx, sy] = sideOf(o), f = F();
    let X = (sx - cm.x) * f / d, Y = (sy - cm.y) * f / d;
    const cs = Math.cos(cm.r), sn = Math.sin(cm.r); [X, Y] = [X * cs - Y * sn, X * sn + Y * cs];
    return { X: W / 2 + X, Y: H / 2 + Y, S: o.s * f / d, d };
  }
  function drawBody(cm, o, p, t) {
    const { X, Y, S } = p;
    if (S < .6 || X < -S * 1.8 || X > W + S * 1.8 || Y < -S * 1.8 || Y > H + S * 1.8) return;
    if (o.glow) { const g = ctx.createRadialGradient(X, Y, S * .3, X, Y, S * 1.6); g.addColorStop(0, o.glow + '.45)'); g.addColorStop(1, o.glow + '0)'); ctx.fillStyle = g; ctx.fillRect(X - S * 1.6, Y - S * 1.6, S * 3.2, S * 3.2); }
    o.tex.draw(t);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(cm.r + t * o.spin);
    const ring = (front) => { ctx.save(); if (front) { ctx.beginPath(); ctx.rect(-S * 2, 0, S * 4, S * 2); ctx.clip(); } ctx.scale(1, .22); ctx.strokeStyle = `rgba(232,211,154,${front ? .95 : .85})`; ctx.lineWidth = Math.max(1, S * .07); ctx.strokeRect(-S * 1.05, -S * 1.05, S * 2.1, S * 2.1); ctx.restore(); };
    if (o.ring) ring(false);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(o.tex.c, -S / 2, -S / 2, S, S);
    if (o.ring) ring(true);
    ctx.restore();
    if (o.moon) { const a = t * 1.2, m = S * .28, mx = X + Math.cos(a) * S * 1.1, my = Y + Math.sin(a) * S * 1.1; P.moon.draw(t); ctx.save(); ctx.translate(mx, my); ctx.rotate(cm.r + t * .4); ctx.drawImage(P.moon.c, -m / 2, -m / 2, m, m); ctx.restore(); }
  }
  function drawGalaxy(cm, g, p, t) {
    const { X, Y, S } = p;
    if (S < 6 || X < -S || X > W + S || Y < -S || Y > H + S) return;
    const core = ctx.createRadialGradient(X, Y, 0, X, Y, S * (g.type === 'elliptical' ? .32 : .16));
    core.addColorStop(0, 'rgba(255,245,230,.85)'); core.addColorStop(1, 'rgba(255,245,230,0)');
    ctx.fillStyle = core; ctx.fillRect(X - S * .35, Y - S * .35, S * .7, S * .7);
    const rot = cm.r + g.ang + t * .1, q0 = Math.max(1, Math.min(6, S / 260));
    for (const pt of g.pts) {
      const a = pt.a + rot, r = pt.d * S;
      ctx.fillStyle = pt.c; ctx.globalAlpha = .45 + .55 * (1 - Math.min(1, pt.d * 2));
      const q = Math.round(pt.big ? q0 * 2 : q0);
      ctx.fillRect(Math.round(X + Math.cos(a) * r), Math.round(Y + Math.sin(a) * r * g.tilt), q, q);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- run ----------
  let t0 = null, jumped = reduce, shown = false;
  function finish() {
    if (shown) return; shown = true;
    title.classList.add('on'); document.body.classList.add('fr-done'); skip.hidden = true;
  }
  let heroOn = true;   // the flight only draws while the hero is on screen
  new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(document.getElementById('hero'));
  function frame(now) {
    if (t0 === null) t0 = now;
    if (!heroOn && t0 !== null && (now - t0) / 1000 > END) { requestAnimationFrame(frame); return; }
    if (jumped) { if ((now - t0) / 1000 < END) t0 = now - END * 1000; jumped = false; }   // straight to the end, still turning
    const t = (now - t0) / 1000;
    const c = cam(Math.min(t, END));
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
    // the deep-space wash, bluer as we go
    const deep = Math.min(1, t / END), g = ctx.createRadialGradient(W * .7, H * 1.1, 0, W * .7, H * 1.1, Math.max(W, H));
    g.addColorStop(0, `rgba(20,30,${90 + 120 * deep},${.25 + .2 * deep})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    stars(c);
    const vis = []; for (const o of B) { const p = project(c, o); if (p) vis.push([o, p]); }
    vis.sort((a, b) => b[1].d - a[1].d);                                     // far first
    for (const [o, p] of vis) (o.kind === 'galaxy' ? drawGalaxy : drawBody)(c, o, p, t);
    if (t >= END - .2) finish();
    requestAnimationFrame(frame);
  }
  const jump = () => { jumped = true; prev = null; };
  skip.onclick = jump;
  addEventListener('keydown', (e) => { if (['Escape', 'Enter', ' '].includes(e.key) && !shown) { e.preventDefault(); jump(); } });
  document.fonts.ready.then(() => requestAnimationFrame(frame));

  // ---------- the looks: sealed turntables, drawn straight to canvas (like /q) ----------
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const HEX = { 'MOONDUST™': '#e9e7e1', 'REGOLITH™': '#8a8780', 'GOOD® BLUE': '#0000ff', 'GOLD™': '#d8b23c', 'FLIGHTLINE™': '#2447c9',
    'SIGNAL™': '#ff6a13', 'VISITOR™': '#7bd34a', 'COTTON™': '#f4f4f2', 'JET™': '#131416' };
  const dots = (cw) => `<span class="dots">${cw.split('/').map((n) => `<i style="background:${HEX[n] || '#000'}"></i>`).join('')}</span>`;
  const LOOKS = [
    ['MOON® · MOON® HELMET', 'MOONDUST™/GOOD® BLUE'],
    ['MOON® · MOON® HELMET', 'MOONDUST™/GOLD™'],
    ['GROUND CREW COVERALL', 'FLIGHTLINE™'],
    ['GROUND CREW COVERALL', 'SIGNAL™'],
    ['GROUND CREW COVERALL', 'REGOLITH™'],
    ['VISITOR TEE · GROUND CREW COVERALL', 'JET™/VISITOR™'],
  ];
  $('looks').replaceChildren(...LOOKS.map(([pieces, cw], i) => {
    const f = document.createElement('figure');
    f.dataset.id = `fr-${i + 1}`;
    f.innerHTML = `<div class="n"><span>${String(i + 1).padStart(2, '0')}</span><span>LOOK</span></div><canvas width="202" height="407" aria-hidden="true"></canvas><figcaption><span></span><span>${dots(cw)}${cw}</span></figcaption>`;
    f.querySelector('figcaption span').textContent = pieces;
    f.setAttribute('aria-label', `Look ${i + 1}: ${pieces}, ${cw}`);
    return f;
  }));
  const PIECES = [
    ['MOON®', ['MOONDUST™/GOOD® BLUE', 'MOONDUST™/GOLD™']],
    ['MOON® HELMET', ['MOONDUST™/GOOD® BLUE', 'MOONDUST™/GOLD™']],
    ['GROUND CREW COVERALL', ['FLIGHTLINE™', 'SIGNAL™', 'REGOLITH™']],
    ['VISITOR TEE', ['COTTON™/VISITOR™', 'JET™/VISITOR™', 'VISITOR™/REGOLITH™']],
  ];
  $('pieces').replaceChildren(...PIECES.map(([name, cws], i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${String(i + 1).padStart(2, '0')}</td><td></td><td>${cws.map((c) => `<span class="cw">${dots(c)}${c}</span>`).join('')}</td>`;
    tr.children[1].textContent = name;
    return tr;
  }));
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
  const FW = 202, FH = 407, FRAMES = 24, STEP = 260;
  const shownLooks = new Set(), spinners = [];
  const still = (c, id) => scrambled(id).then((bmp) => {
    if (c.dataset.spin) { bmp.close(); return; }
    c.getContext('2d').drawImage(bmp, 0, 0, FW, FH); bmp.close();
  }).catch(() => {});
  const turntable = (c, id) => {
    if (c.dataset.asked) return; c.dataset.asked = '1';
    scrambled(id.replace(/^fr-/, 'fr-spin-')).then((sheet) => { c.dataset.spin = '1'; spinners.push({ c, sheet, off: spinners.length * 4, drag: 0, drawn: -1 }); }).catch(() => {});
  };
  const near = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { shownLooks.add(e.target); turntable(e.target, e.target.dataset.look); } else shownLooks.delete(e.target);
  }), { rootMargin: '600px 0px' });
  const spinLoop = (now) => {
    const auto = reduce ? 0 : Math.floor(now / STEP);
    for (const sp of spinners) {
      if (!shownLooks.has(sp.c)) continue;
      const k = (((auto + sp.off + sp.drag) % FRAMES) + FRAMES) % FRAMES;
      if (k === sp.drawn) continue;
      sp.drawn = k;
      const x = sp.c.getContext('2d'); x.clearRect(0, 0, FW, FH); x.drawImage(sp.sheet, k * FW, 0, FW, FH, 0, 0, FW, FH);
    }
    requestAnimationFrame(spinLoop);
  };
  requestAnimationFrame(spinLoop);
  document.querySelectorAll('.fr-looks figure').forEach((fig) => {
    const c = fig.querySelector('canvas');
    c.dataset.look = fig.dataset.id; c.addEventListener('contextmenu', (e) => e.preventDefault());
    still(c, fig.dataset.id); near.observe(c);
    let x0 = null, d0 = 0, sp = null;
    fig.addEventListener('pointerdown', (e) => {
      sp = spinners.find((q) => q.c === c); if (!sp) return;
      x0 = e.clientX; d0 = sp.drag; fig.setPointerCapture(e.pointerId); fig.classList.add('turning');
    });
    fig.addEventListener('pointermove', (e) => { if (x0 !== null && sp) sp.drag = d0 + Math.round((e.clientX - x0) / 10); });
    const up = () => { x0 = null; fig.classList.remove('turning'); };
    fig.addEventListener('pointerup', up); fig.addEventListener('pointercancel', up);
  });
})();
