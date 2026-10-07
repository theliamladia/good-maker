// AMONG THE TREES® (GOOD® CAPSULE Nº2) preview page.
// 1. The descent: on load the camera falls gently down a tall dusk sky (clouds
//    passing) while three layers of fall treeline rise into view; it lands on
//    the title. Skip button, scroll, keys or touch land it early; reduced
//    motion starts landed.
// 2. Leaves drift over the page (a canvas), carried up while we fall.
// 3. The capsule: colourways, the six looks (pre-rendered images only:
//    nothing here is downloadable as a skin), and the twelve pieces.
(() => {
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  // ---------- Capsule ----------
  const CW = [
    { id: 'cinnamon-toast-fern',
      a: { name: 'CINNAMON TOAST', hex: '#a65a2e', desc: 'Sunday morning, browned at the edges, sugar on top.' },
      b: { name: 'FERN', hex: '#4f6b45', desc: 'The undergrowth that stays green long after the canopy turns.' } },
    { id: 'wash-day-trench',
      a: { name: 'WASH DAY', hex: '#8eaee6', desc: 'GOOD® BLUE after a hundred washes on the line, softened and warmed by the sun.' },
      b: { name: 'TRENCH', hex: '#c4b38a', desc: 'Khaki for long walks in uncertain weather.' } },
    { id: 'maple-leaf-fatigue',
      a: { name: 'MAPLE LEAF', hex: '#c2452b', desc: 'The red that comes down first and lands on top.' },
      b: { name: 'FATIGUE', hex: '#4a4f2f', desc: 'Olive drab from the surplus store. Broken in, never pressed.' } },
  ];
  const LOOKS = [
    { line: 'good', who: 'Leeeeems', top: 'HALF-ZIP®', bottom: 'CARGO®' },
    { line: 'good', who: 'Chinny', top: 'RUGBY®', bottom: 'PLEAT®' },
    { line: 'good', who: 'mova_tv', top: 'GRANDPA®', bottom: 'CORD®' },
    { line: 'baby', who: 'LindseyyHazel', top: 'SHRUG®', bottom: 'KNIT MIDI®' },
    { line: 'baby', who: 'Isabelleblanco', top: 'VARSITY®', bottom: 'KILT®' },
    { line: 'baby', who: 'CoolB33s', top: 'WRAP®', bottom: 'MAXI®' },
  ];
  const PIECES = [
    ['GOOD® TOPS', [['HALF-ZIP®', 'Track half-zip, pulled down to the chest. Collar, hem and sleeve piping in the second colour.'],
      ['RUGBY®', 'Wide stripes in both colours, a COTTON™ collar and cuffs.'],
      ['GRANDPA®', 'Chunky shawl-collar cardigan with patch pockets, over a tee.']]],
    ['GOOD® BOTTOMS', [['CARGO®', 'Baggy, belted, thigh pockets, stacked at the hem.'],
      ['PLEAT®', 'Wide pleated trouser with a pressed crease and turn-ups.'],
      ['CORD®', 'Corduroy, straight through the leg.']]],
    ['BABY® TOPS', [['SHRUG®', 'Rib-knit shrug that ends at the ribs, over a tank.'],
      ['VARSITY®', 'Cropped varsity cardigan with a chenille G and a striped rib.'],
      ['WRAP®', 'Long-sleeve ballet wrap, tied at the side.']]],
    ['BABY® BOTTOMS', [['KILT®', 'Pleated tartan mini in the season’s colours, with crew socks.'],
      ['MAXI®', 'Floor-length skirt with a front slit.'],
      ['KNIT MIDI®', 'Rib-knit midi that matches the SHRUG®.']]],
  ];
  const twin = (c) => `linear-gradient(90deg, ${c.a.hex} 50%, ${c.b.hex} 50%)`;
  const cwName = (c) => `${c.a.name}™/${c.b.name}™`;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  $('colourways').append(...CW.map((c) => {
    const card = el('article', 'att-cw');
    card.append(el('span', 'att-cw-dot'), el('h3', null, cwName(c)));
    card.querySelector('.att-cw-dot').style.background = twin(c);
    for (const k of ['a', 'b']) {
      const x = c[k], chip = el('div', 'att-chip', `<i></i><div><strong>${x.name}™</strong><span></span><small>${x.hex.toUpperCase()}</small></div>`);
      chip.querySelector('i').style.background = x.hex;
      chip.querySelector('span').textContent = x.desc;
      card.append(chip);
    }
    return card;
  }));

  let cw = 0;
  const looks = LOOKS.map((l, i) => {
    const fig = el('figure', 'att-look', `<div class="att-fig"><img alt="" draggable="false"></div><figcaption><div class="who"></div><div class="what"></div><div class="cw"></div></figcaption>`);
    fig.querySelector('.who').textContent = l.who;
    fig.querySelector('.what').textContent = `${l.top} + ${l.bottom}`;
    fig.addEventListener('contextmenu', (e) => e.preventDefault());
    $(l.line === 'good' ? 'looksGood' : 'looksBaby').append(fig);
    return { ...l, i, img: fig.querySelector('img'), cap: fig.querySelector('.cw') };
  });
  const src = (l, c) => `assets/att/${l.i}-${CW[c].id}.webp`;
  function showCw(c, fade) {
    cw = c;
    for (const id of ['switch', 'switch2']) $(id).querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-checked', j === c));
    for (const gh of ghosts) {
      gh.img.alt = `${gh.name} in ${cwName(CW[c])}, shown without a body.`;
      if (!fade) { gh.img.src = ghostSrc(gh, c); continue; }
      gh.img.style.opacity = 0;
      setTimeout(() => { gh.img.src = ghostSrc(gh, c); gh.img.onload = () => { gh.img.style.opacity = 1; }; }, 250);
    }
    for (const l of looks) {
      const c0 = CW[c];
      l.cap.textContent = `${c0.a.name}™ and ${c0.b.name}™`;
      l.img.alt = `${l.who} in ${l.top} ${c0.a.name}™ and ${l.bottom} ${c0.b.name}™.`;
      if (!fade) { l.img.src = src(l, c); continue; }
      l.img.style.opacity = 0;
      setTimeout(() => { l.img.src = src(l, c); l.img.onload = () => { l.img.style.opacity = 1; }; }, 250);
    }
  }
  // The twelve pieces as ghost mannequins (garment only, no body), floating
  // over their names. They follow the same colourway switch as the looks.
  const slug = (n) => n.replace(/®/g, '').trim().toLowerCase().replace(/\s+/g, '-');
  const ghosts = [];
  $('pieceList').append(...PIECES.map(([title, list]) => {
    const g = el('div', 'att-group', `<h3>${title}</h3><ul></ul>`);
    g.querySelector('ul').append(...list.map(([n, d]) => {
      const li = el('li', null, '<div class="att-ghost"><img alt="" draggable="false"></div><strong></strong><span></span>');
      li.querySelector('strong').textContent = n;
      li.querySelector('span').textContent = d;
      li.querySelector('.att-ghost').style.animationDelay = `${-(ghosts.length * 0.7) % 6}s`;
      li.addEventListener('contextmenu', (e) => e.preventDefault());
      ghosts.push({ name: n, slug: slug(n), img: li.querySelector('img') });
      return li;
    }));
    return g;
  }));
  const ghostSrc = (gh, c) => `assets/att/pieces/${gh.slug}-${CW[c].id}.webp`;

  // Colourway switches (one over the looks, one over the pieces), kept in step.
  for (const id of ['switch', 'switch2']) {
    $(id).append(...CW.map((c, j) => {
      const b = el('button', null, `<i></i>${cwName(c)}`);
      b.type = 'button'; b.setAttribute('role', 'radio');
      b.querySelector('i').style.background = twin(c);
      b.onclick = () => { if (j !== cw) showCw(j, true); };
      return b;
    }));
  }
  showCw(0, false);
  // Warm the cache for the other colourways.
  addEventListener('load', () => {
    for (let c = 0; c < CW.length; c++) { for (const l of looks) new Image().src = src(l, c); for (const gh of ghosts) new Image().src = ghostSrc(gh, c); }
  });


  // ---------- Treeline ----------
  // Three SVG layers, back to front: hazy far hills of trees, the fall canopy,
  // and dark near trunks that meet the page below.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  function layer(opts) {
    const W = 1600, H = 600;
    let out = '';
    for (let x = -40; x < W + 40; x += opts.gap * (0.6 + rnd() * 0.8)) {
      const h = opts.min + rnd() * (opts.max - opts.min), col = pick(opts.colors), base = H - opts.ground;
      if (rnd() < opts.pines) {
        const w = h * (0.32 + rnd() * 0.1);
        for (let k = 0; k < 3; k++) {     // stacked tiers
          const t = base - h * (0.18 + k * 0.27), wk = w * (1 - k * 0.24);
          out += `<polygon fill="${col}" points="${x - wk / 2},${t + h * 0.42} ${x},${t - h * 0.2} ${x + wk / 2},${t + h * 0.42}"/>`;
        }
        out += `<rect fill="${opts.trunk}" x="${x - 3}" y="${base - h * 0.12}" width="6" height="${h * 0.12 + 2}"/>`;
      } else {
        const r = h * (0.22 + rnd() * 0.08);
        out += `<rect fill="${opts.trunk}" x="${x - 4}" y="${base - h * 0.55}" width="8" height="${h * 0.55 + 2}"/>`;
        for (let k = 0; k < 5; k++) {      // a round crown of a few blobs
          const cx = x + (rnd() - 0.5) * r * 1.4, cy = base - h * 0.62 - (rnd() - 0.3) * r * 0.9, rr = r * (0.55 + rnd() * 0.45);
          out += `<circle fill="${rnd() < 0.7 ? col : pick(opts.colors)}" cx="${cx}" cy="${cy}" r="${rr}"/>`;
        }
      }
    }
    out += `<rect fill="${opts.groundColor}" x="0" y="${H - opts.ground}" width="${W}" height="${opts.ground + 1}"/>`;
    return `<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">${out}</svg>`;
  }
  $('trees').innerHTML = [
    layer({ gap: 46, min: 120, max: 210, ground: 70, pines: 0.5, colors: ['#d39a74', '#c98b66', '#dca57a', '#c99572'], trunk: '#c08766', groundColor: '#c98b66' }),
    layer({ gap: 58, min: 190, max: 320, ground: 40, pines: 0.25, colors: ['#b8402a', '#d0802c', '#9c5a22', '#6b6a2e', '#c4602a', '#e0a24a', '#8a3a20'], trunk: '#4a2a18', groundColor: '#5a3220' }),
    layer({ gap: 120, min: 300, max: 470, ground: 22, pines: 0.6, colors: ['#2b1d12', '#33231a', '#3a2818'], trunk: '#2b1d12', groundColor: '#2b1d12' }),
  ].join('');
  const trees = [...$('trees').querySelectorAll('svg')];

  // ---------- Descent ----------
  const sky = $('sky');
  const DURATION = 6500;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const ramp = (a, b, t) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  let p = 0, landed = false, start = null, rush = null;
  let fallSpeed = 0; // px/s the camera moves; leaves get carried up by it
  function frame(prog) {
    const e = ease(prog);
    sky.style.transform = `translateY(${-75 * e}%)`;
    // far trees rise first, near trees last (parallax)
    [[0.35, 0.92, 0.55], [0.48, 0.97, 0.8], [0.6, 1, 1.1]].forEach(([a, b, k], i) => {
      const t = ease(ramp(a, b, prog));
      trees[i].style.transform = `translateY(${(1 - t) * 100 * k}%)`;
    });
  }
  function land() {
    if (landed) return;
    landed = true; p = 1; frame(1); fallSpeed = 0;
    document.body.classList.add('att-landed');
    root.classList.remove('att-falling');
  }
  let lastNow = null;
  function tick(now) {
    if (landed) return;
    if (start == null) start = now;
    const dt = lastNow == null ? 1 / 60 : Math.max(1 / 240, (now - lastNow) / 1000);
    lastNow = now;
    let prog = (now - start) / DURATION;
    if (rush) prog = rush.from + (1 - rush.from) * Math.min(1, (now - rush.at) / 700);
    const prev = p; p = Math.min(1, prog);
    fallSpeed = ((ease(p) - ease(prev)) * 3 * innerHeight) / dt; // px/s: the sky is 4 screens tall, we fall 3
    frame(p);
    if (p >= 1) land(); else requestAnimationFrame(tick);
  }
  const hurry = () => { if (!landed && !rush) rush = { from: p, at: performance.now() }; };
  if (root.classList.contains('att-falling')) {
    frame(0);
    requestAnimationFrame(tick);
    addEventListener('wheel', hurry, { passive: true });
    addEventListener('touchstart', hurry, { passive: true });
    addEventListener('keydown', hurry);
    $('skip').onclick = hurry;
    setTimeout(land, DURATION + 3000); // safety net
  } else {
    land();
  }

  // ---------- Leaves ----------
  const cv = $('leaves'), ctx = cv.getContext('2d');
  const COLORS = ['#c2452b', '#d0802c', '#a65a2e', '#e0a24a', '#8a3a20', '#9c5a22', '#6b6a2e'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let leaves = [], dpr = 1;
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    const n = reduce ? 0 : innerWidth < 700 ? 16 : 30;
    while (leaves.length < n) leaves.push(newLeaf(true));
    leaves.length = n;
  }
  function newLeaf(anywhere) {
    return {
      x: Math.random() * innerWidth, y: anywhere ? Math.random() * innerHeight : -20,
      s: 6 + Math.random() * 8, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.6,
      vy: 18 + Math.random() * 26, sway: 14 + Math.random() * 26, ph: Math.random() * 6.28,
      c: COLORS[Math.floor(Math.random() * COLORS.length)], a: 0.55 + Math.random() * 0.35,
    };
  }
  function drawLeaf(l, x) {
    ctx.save();
    ctx.translate(x * dpr, l.y * dpr); ctx.rotate(l.r); ctx.scale(dpr, dpr);
    ctx.globalAlpha = l.a; ctx.fillStyle = l.c;
    const s = l.s;
    ctx.beginPath();                       // a pointed leaf with a stem
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.75, -s * 0.2, 0, s);
    ctx.quadraticCurveTo(-s * 0.75, -s * 0.2, 0, -s);
    ctx.fill();
    ctx.strokeStyle = l.c; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, s * 0.6); ctx.lineTo(0, s * 1.35); ctx.stroke();
    ctx.restore();
  }
  let last = performance.now();
  function leafTick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const l of leaves) {
      l.ph += dt * 1.3; l.r += l.vr * dt;
      l.y += (l.vy - fallSpeed * 0.9) * dt; // while we fall, leaves rise past us
      if (l.y > innerHeight + 30) Object.assign(l, newLeaf(false));
      if (l.y < -40) { Object.assign(l, newLeaf(false)); l.y = innerHeight + 20; }
      drawLeaf(l, l.x + Math.sin(l.ph) * l.sway);
    }
    requestAnimationFrame(leafTick);
  }
  addEventListener('resize', size);
  size();
  if (!reduce) requestAnimationFrame(leafTick);
})();
