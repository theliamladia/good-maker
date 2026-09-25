// On-load intro: the sky races and zooms in while the clouds ease down to
// their normal drift, then every part of the page flies out from the centre
// of the screen to its place. Skipped for reduced-motion users.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) return;

  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const SKY_MS = 2400;

  // Sky: zoom in, and slow the clouds from fast to their normal speed.
  document.querySelector('.hero-sky').animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }],
    { duration: SKY_MS, easing: EASE, fill: 'forwards' }
  );
  const clouds = [...document.querySelectorAll('.cloud')].flatMap((c) => c.getAnimations());
  const FAST = 16;
  const t0 = performance.now();
  (function slowDown(now) {
    const k = Math.min(1, (now - t0) / SKY_MS);
    const rate = 1 + (FAST - 1) * Math.pow(1 - k, 3); // ease-out to 1x
    clouds.forEach((a) => { a.playbackRate = rate; });
    if (k < 1) requestAnimationFrame(slowDown);
  })(t0);

  // Elements: start small at the screen's centre, fly out to where they live.
  const items = [
    '.site-header', '.ticker-top', '#view3d', '.viewer-bar', '.viewer-wrap > .micro',
    '.panel.left', '.panel.right', '#download', '.ticker-band',
  ].flatMap((sel) => [...document.querySelectorAll(sel)]);
  const cx = innerWidth / 2, cy = innerHeight / 2;
  items.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const dx = cx - (r.left + r.width / 2);
    const dy = cy - (r.top + r.height / 2);
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 1100, delay: 600 + i * 80, easing: EASE, fill: 'backwards' }
    );
  });

  // The animations above now hold everything hidden until its turn.
  root.classList.remove('intro');
})();
