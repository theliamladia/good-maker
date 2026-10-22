// WANDERING® (/wandering): one long pixel valley behind the whole page. It starts at
// night, the sun comes up over the mountain, and the valley runs down past the
// collections to the camp by the lake (evening, a fire going). Drawn on a 160-column
// canvas, scaled up with crisp pixels. The looks come scrambled from /api/outfit
// and are drawn straight to canvas (no image files).
(() => {
  const cv = document.getElementById('scene'), ctx = cv.getContext('2d');
  const main = document.getElementById('main');
  const W = 160;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (v) => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function rng(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const NIGHT = ['#05060f', '#080b1c', '#0b0f26', '#10142f', '#141938', '#191d40', '#1e2246', '#23264b', '#282a4f', '#2d2e53'].map(hex);
  const DAWN = ['#141838', '#1f2352', '#33306a', '#55377a', '#83407e', '#b44d78', '#dc6668', '#f08a55', '#f9b259', '#fdd57a'].map(hex);
  const P = (n, d) => [hex(n), hex(d)];   // [night, dawn]
  const FAR_EDGE = P('#241d38', '#6c4b7e'), FAR = P('#1d1830', '#5a4170');
  const LIT = P('#2c2340', '#c46d72'), LIT2 = P('#30263f', '#d98478'), SHADOW_L = P('#2a2238', '#7b4c6c'), SHADOW_R = P('#1c1830', '#4a3a62'), SPECK = P('#17142a', '#3e3156');
  const SNOW_LIT = P('#5c5a7a', '#fbe3d6'), SNOW_SHADE = P('#3a3852', '#b9a6c8');

  let H, HOR, S, cell, base, topRow, img, stars, far, fire = null, campTop, mistTop, mistBot;
  let sun = 0, frame = 0;

  function build() {
    cell = innerWidth / W;
    H = Math.ceil(main.scrollHeight / cell) + 1;
    cv.width = W; cv.height = H; cv.style.height = `${H * cell}px`;
    img = ctx.createImageData(W, H);
    HOR = Math.round((innerHeight * 0.8) / cell);
    S = clamp(HOR / 90, 1, 3);
    campTop = Math.floor(document.getElementById('campScene').offsetTop / cell);
    const R = rng(1872);
    base = new Float32Array(W * H * 3);
    const put = (x, y, c) => { if (x < 0 || x >= W || y < 0 || y >= H) return; const i = (y * W + x) * 3; base[i] = c[0]; base[i + 1] = c[1]; base[i + 2] = c[2]; };
    const get = (x, y) => { const i = (y * W + x) * 3; return [base[i], base[i + 1], base[i + 2]]; };
    // far range (for the sky pass)
    const ridge = (b, amp, seed, f) => { const r = rng(seed), ph = [r() * 6.3, r() * 6.3, r() * 6.3]; return Array.from({ length: W }, (_, x) => b - amp * (0.5 * Math.sin(x * f + ph[0]) + 0.3 * Math.sin(x * f * 2.3 + ph[1]) + 0.2 * Math.sin(x * f * 5.1 + ph[2]))); };
    far = ridge(HOR - 0.11 * HOR, 0.07 * HOR, 3, 0.05);
    // the valley: hills stepping down toward you, warm light on their crowns
    const HILLS = [['#7a6a86', '#8f7b8e'], ['#4f6a5a', '#7f8a5e'], ['#3d5a44', '#6f7f4a'], ['#2f4a37', '#5e6e3e']].map(([a, b]) => [hex(a), hex(b)]);
    topRow = new Int32Array(W).fill(H);
    HILLS.forEach(([c0, c1], k) => {
      const rg = ridge(HOR + 3 * S + k * 6 * S, (3 + k) * 0.8 * S, 20 + k, 0.04 + k * 0.01);
      for (let x = 0; x < W; x++) {
        const y0 = Math.max(0, Math.floor(rg[x]));
        topRow[x] = Math.min(topRow[x], y0);
        for (let y = y0; y < H; y++) put(x, y, y < rg[x] + 1 ? c1 : c0);
      }
    });
    mistTop = HOR - 2 * S; mistBot = HOR + 8 * S;
    // the meadow, all the way down
    const MEAD = ['#2f4a37', '#35513a', '#3b583d', '#2a4231'].map(hex);
    const mstart = Math.floor(HOR + 28 * S);
    for (let y = mstart; y < H; y++) for (let x = 0; x < W; x++) put(x, y, R() < 0.85 ? MEAD[(x * 7 + y * 13 + ((x * y) % 5)) % 4] : MEAD[0]);
    // the camp: a clearing, a lake, two tents, a canoe and the fire
    const cr = H - campTop;
    const lake = { x: W * 0.7, y: campTop + cr * 0.4, rx: W * 0.22, ry: Math.max(8, cr * 0.14) };
    const clr = { x: W * 0.32, y: campTop + cr * 0.64, rx: W * 0.27, ry: Math.max(10, cr * 0.2) };
    // the river: out of the mist, winding down to the lake
    let rx = W * 0.5;
    for (let y = Math.floor(HOR + 2); y < lake.y; y++) {
      rx += Math.sin(y * 0.045 / S) * 0.9 + Math.sin(y * 0.013 / S) * 0.5;
      rx = clamp(rx, 24, W - 24);
      const pull = smooth((y - (lake.y - 90 * S)) / (90 * S));
      const cx = lerp(rx, lake.x - lake.rx * 0.3, pull);
      const wd = Math.min(1.5 + (y - HOR) * 0.03 / S, 7);
      for (let x = Math.floor(cx - wd); x <= cx + wd; x++) {
        const edge = Math.abs(x - cx) > wd - 1;
        put(x, y, edge ? hex('#c98a6e') : (x + y) % 6 === 0 ? hex('#f6b874') : (x * 2 + y) % 5 === 0 ? hex('#e79a7a') : hex('#d9876f'));
      }
    }
    // pines down both edges, wildflowers in the grass
    const pine = (cx, by, ht) => {
      for (let i = 0; i < ht; i++) { const y = by - i, half = Math.floor((ht - i) * 0.38); for (let x = cx - half; x <= cx + half; x++) put(x, y, x <= cx ? hex('#1d3226') : hex('#26412f')); }
      put(cx, by + 1, hex('#3b2a22'));
    };
    for (let y = mstart + 4; y < H; y += 6) for (const side of [0, 1]) {
      if (R() > 0.8) continue;
      const inCamp = y > campTop + 6;
      const span = inCamp ? 8 : 16;
      const cx = side ? W - 2 - Math.floor(R() * span) : 2 + Math.floor(R() * span);
      pine(cx, y, 7 + Math.floor(R() * 8));
    }
    const FLOW = ['#f3d88a', '#e2672a', '#f7f2ea', '#b9a3d9', '#6f7f4a'].map(hex);
    for (let n = 0; n < H * 2; n++) {
      const x = Math.floor(R() * W), y = mstart + Math.floor(R() * (H - mstart));
      const c = get(x, y);
      if (MEAD.some((m) => m[0] === c[0] && m[1] === c[1])) put(x, y, FLOW[Math.floor(R() * FLOW.length)]);
    }
    // clearing (packed dirt), then the lake with a sandy shore
    for (let y = campTop; y < H; y++) for (let x = 0; x < W; x++) {
      const dc = ((x - clr.x) / clr.rx) ** 2 + ((y - clr.y) / clr.ry) ** 2;
      if (dc < 1 + hash(x, y) * 0.25) put(x, y, hash(x, y * 3) < 0.15 ? hex('#5c4a38') : hex('#6e5a44'));
      const dl = ((x - lake.x) / lake.rx) ** 2 + ((y - lake.y) / lake.ry) ** 2;
      if (dl < 1) put(x, y, (y + Math.floor(x / 5)) % 4 === 0 && hash(x, y) < 0.5 ? hex('#7fa8cf') : hash(x, y) < 0.07 ? hex('#a9c8e4') : hex('#3f6f9a'));
      else if (dl < 1.22) put(x, y, hash(x, y) < 0.3 ? hex('#a08b67') : hex('#b9a27a'));
    }
    // tents: A-frames, the far one first
    const tent = (cx, by, w, h, body, door) => {
      const B = hex(body), D = hex(door), Bd = B.map((v) => v * 0.72);
      for (let i = 0; i < h; i++) {
        const y = by - h + i, half = Math.round(((i + 1) * w) / 2 / h);
        for (let x = cx - half; x <= cx + half; x++) {
          const inDoor = i > h * 0.35 && Math.abs(x - cx) < (i - h * 0.35) * 0.55;
          put(x, y, inDoor ? D : x < cx ? Bd : B);
        }
      }
      put(cx, by - h - 1, hex('#3b2a22')); put(cx, by - h - 2, hex('#3b2a22'));   // the pole
      for (let x = cx - Math.round(w / 2) - 1; x <= cx + Math.round(w / 2) + 1; x++) put(x, by, hex('#4a3a2c'));
    };
    tent(Math.round(W * 0.25), Math.round(clr.y - clr.ry * 0.55), 18, 12, '#f7f2ea', '#0000ff');
    tent(Math.round(W * 0.12), Math.round(clr.y - clr.ry * 0.05), 26, 17, '#0000ff', '#f7f2ea');
    // the canoe, pulled up on the shore
    const cx0 = Math.round(lake.x - lake.rx * 0.62), cy0 = Math.round(lake.y + lake.ry * 0.9);
    for (let i = -9; i <= 9; i++) { put(cx0 + i, cy0, hex('#e2672a')); if (Math.abs(i) < 8) put(cx0 + i, cy0 + 1, hex('#a8421a')); }
    put(cx0 - 10, cy0 - 1, hex('#e2672a')); put(cx0 + 10, cy0 - 1, hex('#e2672a'));
    // the fire: stones, logs, and seats around it
    fire = { x: Math.round(clr.x + 4), y: Math.round(clr.y + clr.ry * 0.2) };
    for (const [dx, dy] of [[-4, 0], [-3, 1], [4, 0], [3, 1], [-2, 2], [2, 2], [0, 2]]) put(fire.x + dx, fire.y + dy, hex('#7d7a74'));
    for (let i = -3; i <= 3; i++) { put(fire.x + i, fire.y + 1, hex('#5a3a22')); put(fire.x + i, fire.y, i % 2 ? hex('#3b2a22') : hex('#6b4428')); }
    for (const [sx, sy] of [[-12, 2], [8, 4]]) for (let i = 0; i < 6; i++) { put(fire.x + sx + i, fire.y + sy, hex('#6b4428')); put(fire.x + sx + i, fire.y + sy + 1, hex('#4a2f1c')); }
    stars = Array.from({ length: 90 }, () => [Math.floor(R() * W), Math.floor(R() * HOR * 0.7), R() < 0.6]);
  }

  // one pass over rows y0..y1
  function draw(y0, y1) {
    const t = sun, d = img.data;
    const band = (y) => {
      const f = clamp(y / (HOR + 6), 0, 1) * (DAWN.length - 1);
      return f;
    };
    const sx = W * 0.16, sr = clamp(0.1 * HOR, 7, 13);
    const sy = lerp(HOR + sr + 2, HOR - 0.38 * HOR, smooth(t));
    const PK = W * 0.69, PY = 0.2 * HOR;
    const sL = (HOR - PY) / (0.6 * W), sR = (HOR - PY) / (0.75 * W);
    const glowR = 22;
    const flick = 0.85 + 0.15 * Math.sin(frame * 1.7) * Math.sin(frame * 0.6);
    const dawnLight = lerp(0.3, 1, smooth(t));
    const duskStart = campTop - 140 * S, duskLen = 140 * S + (H - campTop) * 0.4;
    for (let y = y0; y < y1; y++) {
      const dusk = smooth((y - duskStart) / duskLen);
      const L = dawnLight * (1 - 0.5 * dusk);
      for (let x = 0; x < W; x++) {
        const o = (y * W + x) * 4;
        let c;
        if (y < topRow[x]) {
          // sky: dithered bands, night to dawn
          const f = band(y), i = Math.floor(f), fr = f - i, i2 = Math.min(i + 1, DAWN.length - 1);
          const th = (((x % 2) * 2 + (y % 2) * 3) % 4) / 4 + 0.125;
          const k = fr > th ? i2 : i;
          c = mixc(NIGHT[k], DAWN[k], t);
          const ds = Math.hypot(x - sx, y - sy);
          if (ds < sr) c = ds < sr - 3 ? [255, 244, 196] : [255, 226, 150];
          else if (ds < sr + 6 && (x + y) % 2 === 0) c = c.map((v) => Math.min(255, v + 28 * t));
          if (y >= far[x]) c = mixc(...(y < far[x] + 2 ? FAR_EDGE : FAR), t);
          const dx = x - PK;
          const top = PY + Math.abs(dx) * (dx < 0 ? sL : sR) + 2 * S * Math.sin(x * 0.7) + (Math.abs(dx) > 8 ? 3 * S * Math.sin(x * 0.23) : 0);
          if (y >= top) {
            const lit = dx < 0 && y - top < 0.16 * HOR - Math.abs(dx) * 0.15 * S;
            const snow = y < PY + 0.085 * HOR + 2 * S * Math.sin(x * 1.3) && y - top < 0.055 * HOR;
            const pair = snow ? (dx < 0 ? SNOW_LIT : SNOW_SHADE) : lit ? ((x + y) % 5 ? LIT : LIT2) : dx >= 0 ? ((x * 3 + y) % 11 === 0 ? SPECK : SHADOW_R) : SHADOW_L;
            c = mixc(pair[0], pair[1], t);
          }
          if (y < HOR * 0.75) for (const [stx, sty, warm] of stars) if (stx === x && sty === y && !(y >= top)) c = mixc(warm ? [255, 240, 220] : [190, 190, 230], c, smooth(t * 1.3));
        } else {
          const i = (y * W + x) * 3;
          c = [base[i] * L, base[i + 1] * L * (1 - 0.04 * dusk), base[i + 2] * L * (1 - 0.18 * dusk)];
          if (fire && Math.abs(y - fire.y) < glowR && Math.abs(x - fire.x) < glowR * 1.4) {
            const g = Math.max(0, 1 - Math.hypot((x - fire.x) / 1.4, y - fire.y) / glowR) ** 2 * 0.9 * flick * dusk;
            c = [c[0] + 220 * g, c[1] + 110 * g, c[2] + 40 * g];
          }
        }
        // morning mist at the mountain's foot
        if (y >= mistTop && y < mistBot && hash(x, y) < 0.5 - Math.abs(y - HOR - 2 * S) * 0.05 / S) c = c.map((v) => v * 0.6 + 255 * 0.4 * (0.4 + 0.6 * t));
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }
    // the flames
    if (fire && fire.y - 8 < y1 && fire.y > y0) {
      const r = rng(frame * 7 + 1);
      for (let i = 0; i < 7; i++) {
        const y = fire.y - 1 - i; if (y < y0 || y >= y1) continue;
        const half = Math.max(0, Math.round((3 - i * 0.45) + (r() - 0.5) * 1.6));
        for (let x = fire.x - half; x <= fire.x + half; x++) {
          if (i > 3 && r() < 0.4) continue;
          const core = Math.abs(x - fire.x) < half * 0.5 && i < 4;
          const c = core ? [255, 226, 120] : i > 4 ? [226, 103, 42] : [246, 150, 60];
          const o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
        }
      }
    }
    ctx.putImageData(img, 0, 0, 0, y0, W, y1 - y0);
  }

  // the sunrise, then the fire keeps going (only while the camp is on screen)
  let start = null, last = 0;
  function tick(now) {
    if (start === null) start = now;
    const e = now - start;
    if (sun < 1) {
      sun = clamp((e - 700) / 5200, 0, 1);   // the sunrise plays for everyone (reduced motion included: it's the intro)
      draw(0, Math.min(H, Math.ceil(HOR + 12 * S)));
      if (sun > 0.55) document.body.classList.add('risen');
      if (sun >= 1) draw(0, H);
      else lightValley();
    } else if (now - last > 140) {
      last = now; frame++;
      const viewBot = (scrollY + innerHeight) / cell;
      if (fire && viewBot > fire.y - 40) draw(Math.max(0, fire.y - 30), Math.min(H, fire.y + 24));
    }
    requestAnimationFrame(tick);
  }
  // during the sunrise, light only the part of the valley that is on screen
  function lightValley() {
    const a = Math.floor(scrollY / cell), b = Math.min(H, Math.ceil((scrollY + innerHeight) / cell) + 2);
    const s = Math.max(a, Math.ceil(HOR + 12 * S));
    if (b > s) draw(s, b);
  }

  let lastW = 0, lastH = 0, rt;
  function relayout() {
    if (innerWidth === lastW && main.scrollHeight === lastH) return;
    lastW = innerWidth; lastH = main.scrollHeight;
    build(); draw(0, H);
  }
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(relayout, 120); }).observe(main);
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(relayout, 120); });
  relayout();
  requestAnimationFrame(tick);

  // ---------- the looks: scrambled, straight to canvas ----------
  const scrambled = async (id, tries = 3) => {
    const r = await fetch(`/api/outfit?id=${id}`, { cache: 'no-store' }).catch(() => null);
    if (!r || !r.ok) {
      if (tries > 1 && (!r || r.status >= 500)) { await new Promise((ok) => setTimeout(ok, 800)); return scrambled(id, tries - 1); }
      throw new Error('unavailable');
    }
    const { k, d } = await r.json();
    const kb = Uint8Array.from(atob(k), (ch) => ch.charCodeAt(0));
    return createImageBitmap(new Blob([Uint8Array.from(atob(d), (ch, i) => ch.charCodeAt(0) ^ kb[i % kb.length])]));
  };
  // Each look is a turntable: 24 frames side by side, sealed like the stills. The still
  // shows first; the turntable takes over once it arrives (loaded as the look nears the
  // screen), and only looks on screen are redrawn.
  const FW = 202, FH = 407, FRAMES = 24, STEP = 260;
  const shown = new Set();
  const spinners = [];
  const still = (cvs, id) => scrambled(id).then((bmp) => {
    if (cvs.dataset.spin) { bmp.close(); return; }
    cvs.width = FW; cvs.height = FH;
    const k = Math.min(FW / bmp.width, FH / bmp.height), w = bmp.width * k, h = bmp.height * k;
    cvs.getContext('2d').drawImage(bmp, (FW - w) / 2, FH - h, w, h); bmp.close();
  }).catch(() => {});
  const turntable = (cvs, id) => {
    if (cvs.dataset.asked) return; cvs.dataset.asked = '1';
    scrambled(id.replace(/^wnd-/, 'wnd-spin-')).then((sheet) => {
      cvs.dataset.spin = '1';
      spinners.push({ cvs, sheet, off: spinners.length * 3, drag: 0, drawn: -1 });
    }).catch(() => {});
  };
  const near = new IntersectionObserver((es) => es.forEach((e) => {
    const cvs = e.target;
    if (e.isIntersecting) { shown.add(cvs); turntable(cvs, cvs.dataset.look); } else shown.delete(cvs);
  }), { rootMargin: '600px 0px' });
  // Each spinner remembers the frame it last drew, so a turntable that arrives late (or
  // with reduced motion on, when nothing turns by itself) is drawn straight away.
  const spinLoop = (now) => {
    const auto = Math.floor(now / STEP);   // always turning, slowly (a display, not a flourish)
    for (const s of spinners) {
      if (!shown.has(s.cvs) || s.cvs.hidden) continue;
      const k = (((auto + s.off + s.drag) % FRAMES) + FRAMES) % FRAMES;
      if (k === s.drawn) continue;
      s.drawn = k;
      const c = s.cvs.getContext('2d');
      c.clearRect(0, 0, FW, FH); c.drawImage(s.sheet, k * FW, 0, FW, FH, 0, 0, FW, FH);
    }
    requestAnimationFrame(spinLoop);
  };
  requestAnimationFrame(spinLoop);
  // Drag a look to turn it by hand.
  document.querySelectorAll('.wd-looks figure').forEach((fig) => {
    let x0 = null, d0 = 0, sp = null;
    fig.addEventListener('pointerdown', (e) => {
      sp = spinners.find((s) => s.cvs.parentNode === fig && !s.cvs.hidden); if (!sp) return;
      x0 = e.clientX; d0 = sp.drag; fig.setPointerCapture(e.pointerId); fig.classList.add('turning');
    });
    fig.addEventListener('pointermove', (e) => { if (x0 !== null && sp) sp.drag = d0 + Math.round((e.clientX - x0) / 10); });
    const up = () => { x0 = null; fig.classList.remove('turning'); };
    fig.addEventListener('pointerup', up); fig.addEventListener('pointercancel', up);
  });
  document.querySelectorAll('.wd-looks figure').forEach((f) => {
    const [a, b] = f.querySelectorAll('canvas');
    a.dataset.look = f.dataset.id; still(a, f.dataset.id); near.observe(a);
    if (b && f.dataset.down) { b.dataset.look = f.dataset.down; near.observe(b); }
  });
  document.querySelectorAll('.wd-looks').forEach((g) => { g.addEventListener('contextmenu', (e) => e.preventDefault()); g.addEventListener('dragstart', (e) => e.preventDefault()); });
  document.querySelectorAll('.wd-hood button').forEach((btn) => btn.addEventListener('click', () => {
    const down = btn.dataset.hood === 'down';
    document.querySelectorAll('.wd-hood button').forEach((o) => { o.classList.toggle('on', o === btn); o.setAttribute('aria-pressed', String(o === btn)); });
    document.querySelectorAll('#ysLooks figure').forEach((f) => { const [a, b] = f.querySelectorAll('canvas'); a.hidden = down; b.hidden = !down; if (down) { still(b, b.dataset.look); turntable(b, b.dataset.look); } });
  }));

  // THE COLOR STORY®: hover, focus or tap a bar to read it
  const read = document.getElementById('storyRead');
  const idle = read.innerHTML;
  const show = (b) => {
    document.querySelectorAll('.wd-bar').forEach((o) => o.classList.toggle('on', o === b));
    if (!b) { read.innerHTML = idle; return; }
    read.replaceChildren(Object.assign(document.createElement('b'), { textContent: `${b.dataset.name} · ${b.dataset.hex} · ${b.dataset.where}` }), Object.assign(document.createElement('span'), { textContent: b.dataset.desc }));
  };
  document.querySelectorAll('.wd-bar').forEach((b) => {
    b.addEventListener('mouseenter', () => show(b)); b.addEventListener('focus', () => show(b)); b.addEventListener('click', () => show(b));
  });
  document.querySelector('.wd-strip').addEventListener('mouseleave', () => show(null));
})();
