// Fall leaves drifting behind THE MAKER (same leaves as AMONG THE TREES®).
(() => {
  const cv = document.getElementById('leaves');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const COLORS = ['#c2452b', '#d0802c', '#a65a2e', '#e0a24a', '#8a3a20', '#9c5a22', '#6b6a2e'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let leaves = [], dpr = 1;
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    const n = reduce ? 0 : innerWidth < 700 ? 14 : 26;
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
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.75, -s * 0.2, 0, s);
    ctx.quadraticCurveTo(-s * 0.75, -s * 0.2, 0, -s);
    ctx.fill();
    ctx.strokeStyle = l.c; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, s * 0.6); ctx.lineTo(0, s * 1.35); ctx.stroke();
    ctx.restore();
  }
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const l of leaves) {
      l.ph += dt * 1.3; l.r += l.vr * dt; l.y += l.vy * dt;
      if (l.y > innerHeight + 30) Object.assign(l, newLeaf(false));
      drawLeaf(l, l.x + Math.sin(l.ph) * l.sway);
    }
    if (!document.hidden) requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) { last = performance.now(); requestAnimationFrame(tick); } });
  addEventListener('resize', size);
  size();
  if (!reduce) requestAnimationFrame(tick);
})();
