// GUD™: sink from the OG sky into hell, light the fire (the classic PSX
// DOOM fire, at 8-bit size), then reveal the title and count down.
(() => {
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const world = $('world'), title = $('title'), skip = $('skip');
  // Drop day: 7 days from the announcement (midnight US Eastern).
  const DROP = Date.parse('2026-10-20T00:00:00-04:00');

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
  addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') arrive(); });

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

  // ---------- Countdown ----------
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const left = Math.max(0, DROP - Date.now());
    if (!left) { $('count').className = 'gd-count done'; $('count').textContent = 'IT HAS RISEN.'; return; }
    const s = Math.floor(left / 1000);
    $('cd-d').textContent = pad(Math.floor(s / 86400));
    $('cd-h').textContent = pad(Math.floor(s / 3600) % 24);
    $('cd-m').textContent = pad(Math.floor(s / 60) % 60);
    $('cd-s').textContent = pad(s % 60);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();
})();
