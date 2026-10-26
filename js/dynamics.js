// GOOD® DYNAMICS (/dynamics), GOOD® CRATE Nº003. The intro: on black, a white square in the middle,
// then another, then another, then another; they stand side by side, the middle two rise into the
// mark, the ground wipes to GOOD® BLUE and DYNAMICS® arrives. The looks are sealed (/api/outfit)
// and drawn straight to canvas as turntables, like /wandering and /q.
(() => {
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const C = { 'SLATE™': '#5e6873', 'JET™': '#131416', 'CONTRAIL™': '#eef0f2', 'GOOD® BLUE': '#0000ff',
    'LHR™': '#3a2560', 'CDG™': '#8f8b85', 'LAX™': '#f1f0ea', 'DXB™': '#c9b38c', 'AMS™': '#ffd200', 'JFK™': '#b3121f' };
  const dots = (cw) => `<span class="gd-dots">${[...new Set(cw.split(/ · |\//))].map((n) => `<i style="background:${C[n] || '#000'}"></i>`).join('')}</span>`;
  const LOCK = { sq: 0.25, pos: 'lead', valign: 'centre', lift: 0.02, gap: 0.62, regPos: 'cap' };

  // ---------- the hero logo: built once, scaled by its viewBox ----------
  const fontsReady = Promise.race([Promise.all([document.fonts.load('100px Michroma', 'DYNAMICS®'), document.fonts.ready]), wait(2500)]).catch(() => {});
  fontsReady.then(() => {
    const build = (svg) => {
      const g = lockup(svg, { ...LOCK, size: 100, x: 0, y: 0 });
      const b = svg.getBBox(), pad = 4;
      svg.setAttribute('viewBox', `${b.x - pad} ${b.y - pad} ${b.width + 2 * pad} ${b.height + 2 * pad}`);
      return g;
    };
    if ($('coLogo')) build($('coLogo'));   // DYNAMICS® again, where the company is introduced
    return build($('heroLogo'));
  });

  // ---------- the intro ----------
  let skipped = false;
  const intro = $('intro'), sq = [...intro.querySelectorAll('.gd-sq')];
  const place = (el, x, y, s) => Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${s}px`, height: `${s}px` });
  function done() {
    if (intro.classList.contains('done')) return;
    intro.classList.add('done'); document.body.classList.remove('intro');
    setTimeout(() => { intro.hidden = true; }, 700);
    try { sessionStorage.setItem('gd-seen', '1'); } catch {}
  }
  const skip = () => { skipped = true; done(); };
  $('skip').onclick = skip;
  addEventListener('keydown', (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) skip(); });
  intro.addEventListener('click', (e) => { if (e.target !== $('skip')) skip(); });
  (async () => {
    await fontsReady;
    const W = innerWidth, H = innerHeight, S = Math.round(Math.min(W, H) * 0.1), cx = W / 2, cy = H / 2;
    // 1-4: a square in the middle, then another: the ones before step back a little, like a stack
    sq.forEach((el) => place(el, cx - S / 2, cy - S / 2, S));
    for (let i = 0; i < 4; i++) {
      if (skipped) return;
      for (let j = 0; j < i; j++) { const d = (i - j) * S * 0.26; place(sq[j], cx - S / 2 - d, cy - S / 2 - d, S); sq[j].style.opacity = String(1 - (i - j) * 0.22); }
      sq[i].classList.add('on');
      await wait(620);
    }
    if (skipped) return;
    // side by side
    sq.forEach((el, i) => { el.style.opacity = '1'; place(el, cx - 2 * S + i * S, cy - S / 2, S); });
    await wait(1000); if (skipped) return;
    // the middle two rise: the mark
    sq.forEach((el, i) => place(el, cx - 2 * S + i * S, i === 1 || i === 2 ? cy - S : cy, S));
    await wait(1000); if (skipped) return;
    // the ground wipes to GOOD® BLUE
    $('wipe').classList.add('on');
    await wait(1000); if (skipped) return;
    // DYNAMICS®: the squares settle into the lockup's mark, the word comes in
    const word = $('introWord');
    const F = Math.min(W * 0.075, 110), cap = 0.75 * F;
    lockup(word, { ...LOCK, size: F, x: W / 2, y: H / 2 + cap / 2, centre: true });
    const rects = [...word.querySelectorAll('rect')];
    word.querySelectorAll('text').forEach((t) => t.classList.add('w'));
    rects.forEach((r) => { r.style.opacity = '0'; });
    const [top, bl, br] = rects.map((r) => r.getBoundingClientRect()), s = bl.width;
    place(sq[0], bl.left, bl.top, s); place(sq[1], top.left, top.top, s); place(sq[2], top.left + s, top.top, s); place(sq[3], br.left, br.top, s);
    await wait(500); if (skipped) return;
    word.classList.add('on');
    await wait(1600); if (skipped) return;
    done();
  })();

  // ---------- the looks ----------
  const LOOKS = [
    ['FLIGHT JACKET® · CREW TROUSER', 'JET™/CONTRAIL™ · JET™'],
    ['CREW TEE · FLIGHT CARGO', 'CONTRAIL™/GOOD® BLUE · SLATE™'],
    ['PILOT SHIRT® · CONTRAIL WIDE TROUSER', 'SLATE™/CONTRAIL™ · CONTRAIL™'],
    ['HANGAR HOODIE® · TECH JOGGER', 'CONTRAIL™/GOOD® BLUE · JET™/CONTRAIL™'],
    ['MOCK NECK® · PILOT SHORT', 'JET™/CONTRAIL™ · SLATE™'],
    ['SPORTS BRA · YOGA PANT', 'JET™ · JET™', 'dyn-7'],
    ['SPORTS BRA · WIDE-LEG TROUSER', 'CONTRAIL™ · CONTRAIL™', 'dyn-8'],
  ];
  $('looks').replaceChildren(...LOOKS.map(([pieces, cw, id], i) => {
    const f = document.createElement('figure'); f.dataset.id = id || `dyn-${i + 1}`;
    f.innerHTML = `<canvas width="202" height="407" aria-hidden="true"></canvas><figcaption><span class="n">LOOK ${String(i + 1).padStart(2, '0')}</span><span class="p"></span><p class="gd-cw">${dots(cw)}${cw}</p></figcaption>`;
    f.querySelector('.p').textContent = pieces;
    f.setAttribute('aria-label', `Look ${i + 1}: ${pieces}, ${cw}`);
    return f;
  }));

  // ---------- TARMAC® (in the same crate): colourways after the airports ----------
  const TLOOKS = [
    ['LOUNGE HOODIE® · LOUNGE PANT', 'LHR™ · LHR™'],
    ['LOUNGE HOODIE® · LOUNGE PANT', 'DXB™ · DXB™'],
    ['TRANSIT TEE · LOUNGE PANT · TRAVEL PILLOW', 'LAX™ · LAX™ · DXB™'],
    ['TRANSIT TEE · CARRY-ON TROUSER · EYE MASK', 'CDG™/LHR™ · DXB™ · LHR™'],
    ['PILLOW COLLAR® JACKET · CARRY-ON TROUSER', 'LAX™/LHR™ · LHR™'],
    ['BOARDING PASS PARKA · LOUNGE PANT', 'CDG™/AMS™ · LHR™'],
    ['SAFETY CARD SHIRT · CARRY-ON TROUSER · EYE MASK', 'LAX™/LHR™ · LHR™ · LHR™'],
  ];
  $('tarLooks').replaceChildren(...TLOOKS.map(([pieces, cw], i) => {
    const f = document.createElement('figure'); f.dataset.id = `dyn-t${i + 1}`;
    f.innerHTML = `<canvas width="202" height="407" aria-hidden="true"></canvas><figcaption><span class="n">LOOK ${String(i + 1).padStart(2, '0')}</span><span class="p"></span><p class="gd-cw">${dots(cw)}${cw}</p></figcaption>`;
    f.querySelector('.p').textContent = pieces;
    f.setAttribute('aria-label', `TARMAC® look ${i + 1}: ${pieces}, ${cw}`);
    return f;
  }));
  // THE LOOKS: TARMAC® first, then DYNAMICS®, numbered straight through
  $('looks').querySelectorAll('.n').forEach((n, i) => { n.textContent = `LOOK ${String(i + 1 + TLOOKS.length).padStart(2, '0')}`; });
  const TPIECES = [
    ['LOUNGE HOODIE®', 'LHR™ · CDG™ · LAX™ · DXB™'], ['LOUNGE PANT', 'LHR™ · CDG™ · LAX™ · DXB™'], ['TRANSIT TEE', 'LHR™ · CDG™ · LAX™ · DXB™'],
    ['CABIN SOCK SLIDE', 'WITH THE LOUNGE PANT'], ['PILLOW COLLAR® JACKET', 'LAX™ · LHR™'], ['CARRY-ON TROUSER', 'LHR™ · DXB™'],
    ['BOARDING PASS PARKA', 'CDG™ · LHR™'], ['SAFETY CARD SHIRT', 'LAX™/LHR™'], ['EYE MASK', 'LHR™ · JFK™'], ['TRAVEL PILLOW', 'DXB™'],
    ['RED-EYE® LOUNGE SET · THE CHASE', 'JFK™/AMS™'],
  ];
  $('tarPieces').replaceChildren(...TPIECES.map(([name, cw], i) => {
    const tr = document.createElement('tr'); if (/CHASE/.test(name)) tr.className = 'chase';
    tr.innerHTML = `<td>${String(i + 1).padStart(2, '0')}</td><td></td><td>${C[cw.split(/ · |\//)[0]] ? dots(cw) : ''} ${cw}</td>`;
    tr.children[1].textContent = name;
    return tr;
  }));

  // ---------- the odds (per crate) ----------
  const ODDS = [
    ['TARMAC® ESSENTIALS', 'LOUNGE HOODIE®, LOUNGE PANT, TRANSIT TEE, TRAVEL PILLOW, EYE MASK', '48%'],
    ['DYNAMICS®', 'FLIGHT JACKET®, CREW TEE, PILOT SHIRT®, HANGAR HOODIE®, MOCK NECK®, FLIGHT CARGO, CREW TROUSER, TECH JOGGER, PILOT SHORT, CONTRAIL WIDE TROUSER, SPORTS BRA, YOGA PANT, WIDE-LEG TROUSER', '36%'],
    ['TARMAC® AVANT-GARDE', 'PILLOW COLLAR® JACKET, CARRY-ON TROUSER, BOARDING PASS PARKA, SAFETY CARD SHIRT', '13%'],
    ['THE CHASE', 'RED-EYE® LOUNGE SET (JFK™/AMS™)', '1.5%'],
    ['THE CHASE', 'HANGAR HOODIE® · TECH JOGGER (GOOD® BLUE/CONTRAIL™)', '1.5%'],
  ];
  $('odds').replaceChildren(...ODDS.map(([tier, what, p]) => {
    const tr = document.createElement('tr'); if (tier === 'THE CHASE') tr.className = 'chase';
    tr.innerHTML = '<td></td><td></td><td></td>';
    [tier, what, p].forEach((t, k) => { tr.children[k].textContent = t; });
    return tr;
  }));

  // ---------- the pieces ----------
  const PIECES = [
    ['FLIGHT JACKET®', 'JET™/CONTRAIL™'], ['CREW TEE', 'CONTRAIL™/GOOD® BLUE'], ['PILOT SHIRT®', 'SLATE™/CONTRAIL™'],
    ['HANGAR HOODIE®', 'CONTRAIL™/GOOD® BLUE'], ['MOCK NECK®', 'JET™/CONTRAIL™'], ['FLIGHT CARGO', 'SLATE™'], ['CREW TROUSER', 'JET™'],
    ['TECH JOGGER', 'JET™/CONTRAIL™'], ['PILOT SHORT', 'SLATE™'], ['CONTRAIL WIDE TROUSER', 'CONTRAIL™'],
    ['SPORTS BRA', 'JET™ · CONTRAIL™ · SLATE™'], ['YOGA PANT', 'JET™ · CONTRAIL™ · SLATE™'], ['WIDE-LEG TROUSER', 'JET™ · CONTRAIL™ · SLATE™'],
    ['HANGAR HOODIE® · THE CHASE', 'GOOD® BLUE/CONTRAIL™'], ['TECH JOGGER · THE CHASE', 'GOOD® BLUE/CONTRAIL™'],
  ];
  $('pieces').replaceChildren(...PIECES.map(([name, cw], i) => {
    const tr = document.createElement('tr'); if (/CHASE/.test(name)) tr.className = 'chase';
    tr.innerHTML = `<td>${String(i + 1 + TPIECES.length).padStart(2, '0')}</td><td></td><td>${dots(cw)} ${cw}</td>`;
    tr.children[1].textContent = name;
    return tr;
  }));

  // ---------- the fleet: a showroom. Each vehicle on its own stage, rolling (or flying) in when it
  // comes into view, in side profile. Jets hover, cars sit. ----------
  const FLEET = [
    { f: 'roadster01', n: 'GD® ROADSTER01', d: 'TWO-SEAT COUPE', price: '$50,000', air: false, specs: [['TOP SPEED', '105 mph'], ['POWER', 'Electric, 80 kWh'], ['SEATS', '2']], views: [['-side', 'SIDE']] },
    { f: 'energy01', n: 'GD® ENERGY01', d: 'TWO-SEAT HYPERCAR', price: '$1,500,000', air: false, specs: [['TOP SPEED', '210 mph'], ['POWER', 'Electric, 120 kWh'], ['SEATS', '2']], views: [['-side', 'SIDE']] },
    { f: 'plane01', n: 'GD® PLANE01', d: 'PRIVATE JET, FLIES ITSELF', price: '$8,000,000', air: true, specs: [['TOP SPEED', '350 kt · TURBO 875 kt'], ['POWER', 'Fuel, 2,400 L'], ['SEATS', '4']], views: [['-side', 'SIDE']] },
    { f: 'sprint01', n: 'GD® SPRINT01', d: 'SINGLE-SEAT JET', price: '$12,000,000', air: true, specs: [['TOP SPEED', '1,250 kt'], ['POWER', 'Fuel, 1,600 L'], ['SEATS', '1']], views: [['-side', 'SIDE']] },
  ];
  const stages = FLEET.map((v, i) => {
    const el = document.createElement('article');
    el.className = `gd-bay${v.air ? ' air' : ''}${i % 2 ? ' flip' : ''}`;
    el.innerHTML = `<div class="gd-stage"><div class="gd-floor"></div><div class="gd-car"></div><div class="gd-angles" role="group"></div></div>
      <div class="gd-spec"><span class="no">${String(i + 1).padStart(2, '0')}</span><h3></h3><p class="d"></p><dl></dl><p class="pr"></p></div>`;
    el.querySelector('h3').textContent = v.n; el.querySelector('.d').textContent = v.d; el.querySelector('.pr').textContent = v.price;
    el.querySelector('dl').innerHTML = v.specs.map(([k, x]) => `<div><dt>${k}</dt><dd>${x}</dd></div>`).join('');
    el.querySelector('.gd-angles').setAttribute('aria-label', `${v.n} angles`);
    const car = el.querySelector('.gd-car'), chips = el.querySelector('.gd-angles');
    const imgs = v.views.map(([suf, label], k) => {
      const img = new Image(); img.src = `/assets/dynamics/${v.f}${suf}.webp`; img.alt = `${v.n}, ${label.toLowerCase()} view`; img.decoding = 'async'; img.draggable = false;
      if (k === 0) img.className = 'on'; car.append(img);
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', String(k === 0));
      b.onclick = () => { st.hold = true; show(k); }; chips.append(b);
      return img;
    });
    const st = { el, k: 0, hold: false, n: imgs.length };
    const show = (k) => {
      st.k = k;
      imgs.forEach((im, j) => im.classList.toggle('on', j === k));
      chips.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === k)));
    };
    st.show = show;
    if (imgs.length < 2) chips.remove();   // one angle: no picker
    $('fleet').append(el);
    return st;
  });
  // In view: roll in once, then turn through the angles every few seconds (until someone picks one)
  const bays = new IntersectionObserver((es) => es.forEach((e) => {   // watch the stage, not the whole bay (tall on phones)
    const st = stages.find((s) => s.stage === e.target); if (!st) return;
    st.seen = e.isIntersecting;
    if (e.isIntersecting) st.el.classList.add('in');
  }), { threshold: 0.4 });
  stages.forEach((s) => { s.stage = s.el.querySelector('.gd-stage'); bays.observe(s.stage); });
  setInterval(() => stages.forEach((s) => { if (s.seen && !s.hold && s.n > 1) s.show((s.k + 1) % s.n); }), 3200);

  // ---------- sealed turntables (from js/wandering.js) ----------
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
  const shown = new Set(), spinners = [];
  const still = (c, id) => scrambled(id).then((bmp) => {
    if (c.dataset.spin) { bmp.close(); return; }
    c.getContext('2d').drawImage(bmp, 0, 0, FW, FH); bmp.close();
  }).catch(() => {});
  const turntable = (c, id) => {
    if (c.dataset.asked) return; c.dataset.asked = '1';
    scrambled(id.replace(/^dyn-/, 'dyn-spin-')).then((sheet) => { c.dataset.spin = '1'; spinners.push({ c, sheet, off: spinners.length * 4, drag: 0, drawn: -1 }); }).catch(() => {});
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
      const x = s.c.getContext('2d'); x.clearRect(0, 0, FW, FH); x.drawImage(s.sheet, k * FW, 0, FW, FH, 0, 0, FW, FH);
    }
    requestAnimationFrame(spin);
  };
  requestAnimationFrame(spin);
  document.querySelectorAll('.gd-looks figure, .gd-chase figure').forEach((fig) => {
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
