// Fills each scrolling ticker with enough copies to cover the screen, so the
// loop (which slides by exactly half the track) never shows a blank gap at
// any width. Speed is set in px/s so wide screens don't scroll faster.
(() => {
  const SPEED = { normal: 35, slow: 25 }; // px per second
  const tracks = [...document.querySelectorAll('.ticker-track')];
  const units = tracks.map((t) => t.firstElementChild.cloneNode(true));

  function fill() {
    const vw = window.innerWidth;
    tracks.forEach((track, i) => {
      track.replaceChildren(units[i].cloneNode(true));
      const w = track.firstElementChild.getBoundingClientRect().width || 1;
      const perHalf = Math.ceil(vw / w) + 1; // each half must be wider than the screen
      const frag = document.createDocumentFragment();
      for (let k = 0; k < perHalf * 2; k++) frag.appendChild(units[i].cloneNode(true));
      track.replaceChildren(frag);
      const speed = track.classList.contains('slow') ? SPEED.slow : SPEED.normal;
      track.style.animationDuration = `${(perHalf * w) / speed}s`;
    });
  }

  let t = 0;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fill, 150); });
  fill();
  if (document.fonts) document.fonts.ready.then(fill); // widths change once web fonts load
})();
