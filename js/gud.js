// GUD™: sink from the OG sky into hell, light the fire (the classic PSX
// DOOM fire, at 8-bit size), then reveal the title and count down.
(() => {
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const world = $('world'), title = $('title'), skip = $('skip');
  // Drop day: released 19 October 2026 (the server's gate is api/_drop.js).
  const DROP = Date.parse('2026-10-19T00:00:00-04:00');

  // ---------- The descent ----------
  let arrived = false, anim = null;
  function arrive() {
    if (arrived) return;
    arrived = true;
    if (anim) anim.finish();
    world.style.transform = 'translateY(-300vh)';
    document.body.classList.add('arrived');
    skip.classList.add('gone');
    setTimeout(() => title.classList.add('on'), reduce ? 0 : 350);
  }
  if (reduce) arrive();
  else {
    anim = world.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-300vh)' }],
      { duration: 6500, delay: 900, easing: 'cubic-bezier(0.55, 0, 0.25, 1)', fill: 'forwards' });
    anim.finished.then(arrive).catch(() => {});
  }
  skip.onclick = arrive;
  addEventListener('keydown', (e) => { if (e.target.closest && e.target.closest('input')) return; if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') arrive(); });

  // ---------- Logo ----------
  // Metal Mania at 28px with hard edges, scaled up by CSS: 8-bit metal that still reads GUD.
  async function drawLogo() {
    try { await document.fonts.load('28px "Metal Mania"'); } catch { /* fall back to whatever loads */ }
    const c = $('logo'), x = c.getContext('2d'), h = 28, font = `${h}px "Metal Mania", serif`;
    x.font = font;
    c.width = Math.ceil(x.measureText('GUD').width) + 4; c.height = Math.ceil(h * 1.15);
    x.font = font; x.fillStyle = '#ff1a10'; x.fillText('GUD', 2, Math.round(h * 0.92));
    const d = x.getImageData(0, 0, c.width, c.height);
    for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0;
    x.putImageData(d, 0, 0);
  }
  drawLogo();

  // ---------- Fire ----------
  const cv = $('fire'), ctx = cv.getContext('2d');
  // Square fire cells: 60 rows, as many columns as the canvas's shape needs.
  const H = 60, W = Math.max(60, Math.round(H * cv.clientWidth / Math.max(1, cv.clientHeight)));
  cv.width = W; cv.height = H;
  const PAL = [[7,7,7],[31,7,7],[47,15,7],[71,15,7],[87,23,7],[103,31,7],[119,31,7],[143,39,7],[159,47,7],[175,63,7],[191,71,7],[199,71,7],[223,79,7],[223,87,7],[223,87,7],[215,95,7],[215,103,15],[207,111,15],[207,119,15],[207,127,15],[207,135,23],[199,135,23],[199,143,23],[199,151,31],[191,159,31],[191,159,31],[191,167,39],[191,167,39],[191,175,47],[183,175,47],[183,183,47],[183,183,55],[207,207,111],[223,223,159],[239,239,199],[255,255,255]];
  const px = new Uint8Array(W * H);
  for (let x = 0; x < W; x++) px[(H - 1) * W + x] = PAL.length - 1;
  const img = ctx.createImageData(W, H);
  function step() {
    for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) {
      const src = y * W + x, v = px[src];
      if (!v) { px[src - W] = 0; continue; }
      const r = Math.round(Math.random() * 3) & 3;
      const dst = src - r + 1;
      px[Math.max(0, dst - W)] = Math.max(0, v - (r & 1) - (Math.random() < 0.35 ? 1 : 0));
    }
    for (let i = 0; i < W * H; i++) {
      const v = px[i], c = PAL[v], o = i * 4;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = v ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);
  }
  let last = 0;
  (function loop(t) {
    if (t - last > 45) { step(); last = t; } // ~22fps: chunky, like the old games
    if (!reduce) requestAnimationFrame(loop);
  })(0);
  if (reduce) for (let i = 0; i < 80; i++) step();

  // ---------- Embers ----------
  const embers = $('embers');
  if (!reduce) setInterval(() => {
    if (!arrived || document.hidden) return;
    const e = document.createElement('i');
    e.className = 'gd-ember';
    e.style.left = `${Math.random() * 100}%`;
    e.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
    e.style.animationDuration = `${3 + Math.random() * 4}s`;
    embers.appendChild(e);
    e.addEventListener('animationend', () => e.remove());
  }, 140);

  // ---------- Latin ----------
  // Incantations under the title, one at a time.
  const LATIN = [
    'EX CAELO IN INFERNUM.',                    // from the sky into hell
    'BONUM ET MALUM, UNA VESTIS.',              // good and evil, one garment
    'GOOD® ET GUD™: DUO NOMINA, UNA FLAMMA.',   // two names, one flame
    'QUOD SUPRA CAERULEUM EST, INFRA ARDET.',   // what is blue above burns below
    'NON OMNE QUOD ARDET CONSUMITUR.',          // not everything that burns is consumed
    'DESCENDITE. INDUITE. ARDETE.',             // descend. get dressed. burn.
    'IN TOLERANTIA, FLAMMA.',                   // in tolerance, flame
    'SURGIT.',                                  // it rises
  ];
  const latin = $('latin');
  let li = 0;
  if (!reduce) setInterval(() => {
    latin.classList.add('out');
    setTimeout(() => { li = (li + 1) % LATIN.length; latin.textContent = LATIN[li]; latin.classList.remove('out'); }, 380);
  }, 3600);

  // ---------- Early views (password) ----------
  // Nothing is in the page: the views arrive sealed from /api/ubiquity (vault "gud")
  // only for the right password, and are drawn onto canvases (no image URLs).
  const api = async (body) => {
    const r = await fetch('/api/ubiquity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vault: 'gud', ...body }) });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  };
  const form = $('pass'), views = $('views'), grid = $('grid');
  let opened = false;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const password = $('pw').value.trim().toUpperCase();
    if (!password) return;
    form.classList.add('busy');
    try {
      const { files } = await api({ password });
      if (!opened) {
        opened = true;
        let group = null;
        grid.replaceChildren(...files.flatMap((f) => {
          const out = [];
          if (f.group && f.group !== group) {
            group = f.group;
            const h = document.createElement('h3'); h.className = 'gd-group'; h.textContent = group; out.push(h);
          }
          const fig = document.createElement('figure'); fig.className = 'gd-card';
          const cv = document.createElement('canvas');
          const cap = document.createElement('figcaption'); cap.textContent = f.line;
          const b = document.createElement('b'); b.textContent = f.name; cap.append(b);
          fig.append(cv, cap);
          api({ password, file: f.id }).then(async ({ data }) => {
            const bytes = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
            const bmp = await createImageBitmap(new Blob([bytes]));
            cv.width = bmp.width; cv.height = bmp.height;
            cv.getContext('2d').drawImage(bmp, 0, 0); bmp.close();
          }).catch(() => {});
          out.push(fig);
          return out;
        }));
      }
      $('pw').value = '';
      arrive();
      views.hidden = false;
    } catch {
      form.classList.remove('no'); void form.offsetWidth; form.classList.add('no');
    } finally { form.classList.remove('busy'); }
  };
  $('closeViews').onclick = () => { views.hidden = true; };
  views.addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !views.hidden) views.hidden = true; });

  // ---------- It has risen ----------
  // After the drop, the pieces are public: the gallery comes from the server's GUD™
  // catalogue (api/outfit?gud=1), each render scrambled and drawn straight to canvas.
  let launched = false;
  async function launch() {
    if (launched) return; launched = true;
    let cat = null;
    try { const r = await fetch('api/outfit?gud=1', { cache: 'no-store' }); if (r.ok) cat = await r.json(); } catch { /* not yet */ }
    if (!cat) { launched = false; return; }
    const draw = async (id, cv) => {
      const r = await fetch(`api/outfit?id=${id}`, { cache: 'no-store' });
      if (!r.ok) return;
      const { k, d } = await r.json();
      const kb = Uint8Array.from(atob(k), (c) => c.charCodeAt(0));
      const bmp = await createImageBitmap(new Blob([Uint8Array.from(atob(d), (c, i) => c.charCodeAt(0) ^ kb[i % kb.length])]));
      cv.width = bmp.width; cv.height = bmp.height; cv.getContext('2d').drawImage(bmp, 0, 0); bmp.close();
    };
    let group = null;
    grid.replaceChildren(...cat.renders.flatMap((f) => {
      const out = [];
      if (f.group !== group) { group = f.group; const h = document.createElement('h3'); h.className = 'gd-group'; h.textContent = group; out.push(h); }
      const fig = document.createElement('figure'); fig.className = 'gd-card';
      const cv = document.createElement('canvas');
      const cap = document.createElement('figcaption'); cap.textContent = f.line;
      const b = document.createElement('b'); b.textContent = f.name; cap.append(b);
      fig.append(cv, cap); draw(f.id, cv).catch(() => {});
      out.push(fig);
      return out;
    }));
    opened = true;
    views.querySelector('h2').textContent = 'GUD™ · OUT NOW';
    // The password is no longer needed: two ways in instead.
    const row = document.createElement('div'); row.className = 'gd-launch';
    const see = document.createElement('button'); see.type = 'button'; see.className = 'gd-btn'; see.textContent = 'SEE THE PIECES';
    see.onclick = () => { arrive(); views.hidden = false; };
    const wear = document.createElement('a'); wear.className = 'gd-btn gd-btn-alt'; wear.href = './?filter=gud'; wear.textContent = 'WEAR IT IN MAKER® →';
    row.append(see, wear);
    form.replaceWith(row);
  }

  // ---------- Countdown ----------
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const left = Math.max(0, DROP - Date.now());
    if (!left) { $('count').className = 'gd-count done'; $('count').textContent = 'IT HAS RISEN.'; launch(); return; }
    const s = Math.floor(left / 1000);
    $('cd-d').textContent = pad(Math.floor(s / 86400));
    $('cd-h').textContent = pad(Math.floor(s / 3600) % 24);
    $('cd-m').textContent = pad(Math.floor(s / 60) % 60);
    $('cd-s').textContent = pad(s % 60);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();
})();
