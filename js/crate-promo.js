// MAKER®: the newest GOOD® CRATE (Nº002, ART® IN MOTION) in the bottom-right corner.
// Clicking it (or the first visit, once) opens a short intro with the way to its page.
(() => {
  const seen = (() => { try { return localStorage.getItem('goodCrate2Intro') === '1'; } catch { return true; } })();
  const remember = () => { try { localStorage.setItem('goodCrate2Intro', '1'); } catch {} };

  const btn = document.createElement('a');
  btn.className = 'cp-crate cp-crate2'; btn.href = 'inmotion';
  btn.setAttribute('aria-label', 'GOOD® CRATE Nº002: open the intro');
  btn.innerHTML = '<img src="assets/crate2.svg" alt="" draggable="false"><span class="cp-tag mono">GOOD® CRATE 2</span>';
  document.body.append(btn);

  const modal = document.createElement('div');
  modal.className = 'cp-modal'; modal.hidden = true;
  modal.innerHTML = `
    <div class="cp-backdrop" data-close></div>
    <section class="cp-card cp-card2" role="dialog" aria-modal="true" aria-labelledby="cpTitle">
      <button type="button" class="cp-close mono" data-close aria-label="Close">✕</button>
      <img class="cp-art" src="assets/crate2.svg" alt="" draggable="false">
      <p class="cp-kicker mono">NEW · GOOD® CRATE Nº002</p>
      <h2 class="cp-title" id="cpTitle">ART® IN MOTION</h2>
      <p class="cp-lede">The new collection from GOOD®: a study of colour in movement, painted en plein air. A white crate, six pigments on MARSHMALLOW™, thirty pieces.</p>
      <ul class="cp-list mono">
        <li><b>THE CHASE</b> JEAN® PAINTER SPLATTER and SCARF® I'M SOWWY, 1% each</li>
        <li><b>ACCESSORIES</b> the SCARF®, now in SPLATTER</li>
        <li><b>LOOKBOOK</b> the collection, worn by our players</li>
        <li><b>OPEN NOW</b> 5 GOOD® COINS a crate, every pull serialized</li>
      </ul>
      <div class="cp-actions">
        <a class="cp-go mono" href="inmotion">OPEN THE NEW CRATE →</a>
        <a class="cp-later mono" href="releases">ALL RELEASES®</a>
        <button type="button" class="cp-later mono" data-close>NOT NOW</button>
      </div>
      <p class="cp-timer mono" data-coin-timer></p>
    </section>`;
  document.body.append(modal);

  const app = () => window.GoodApp;
  function open() { window.GoodCoinTimer && GoodCoinTimer.refresh(true); modal.hidden = false; app() && app().setModalOpen && app().setModalOpen(true); modal.querySelector('.cp-go').focus(); remember(); }
  function close() { modal.hidden = true; app() && app().setModalOpen && app().setModalOpen(false); }
  btn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  if (!seen) setTimeout(() => { if (document.querySelector('.help-modal:not([hidden]), .rw-modal:not([hidden])')) return; open(); }, 2500);
})();
