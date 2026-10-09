// THE MAKER: the GOOD® CRATE in the bottom-right corner. Clicking it (or the
// first visit, once) opens a short intro with the way to the crate page.
(() => {
  const seen = (() => { try { return localStorage.getItem('goodCrateIntro') === '1'; } catch { return true; } })();
  const remember = () => { try { localStorage.setItem('goodCrateIntro', '1'); } catch {} };

  const btn = document.createElement('a');
  btn.className = 'cp-crate'; btn.href = 'crate.html';
  btn.setAttribute('aria-label', 'GOOD® CRATE: open the intro');
  btn.innerHTML = '<img src="assets/crate.svg" alt="" draggable="false"><span class="cp-tag mono">GOOD® CRATE</span>';
  document.body.append(btn);

  const modal = document.createElement('div');
  modal.className = 'cp-modal'; modal.hidden = true;
  modal.innerHTML = `
    <div class="cp-backdrop" data-close></div>
    <section class="cp-card" role="dialog" aria-modal="true" aria-labelledby="cpTitle">
      <button type="button" class="cp-close mono" data-close aria-label="Close">✕</button>
      <div class="cp-rays" aria-hidden="true"></div>
      <img class="cp-art" src="assets/crate.svg" alt="" draggable="false">
      <p class="cp-kicker mono">NEW · GOOD® CRATE Nº001</p>
      <h2 class="cp-title" id="cpTitle">Something soft is trying to get out.</h2>
      <p class="cp-lede">One crate, solid GOOD® BLUE. Inside: the archived GOODIE®s, the I'M SOWWY shirts and every RUNWAY® piece, most of them never released. Open one for 5 GOOD® COINS, watch the reel, keep what you pull.</p>
      <ul class="cp-list mono">
        <li><b>THE CHASE</b> GOODIE® I'M SOWWY, from a ★ GOLD ROLL</li>
        <li><b>SERIALIZED</b> every pull gets a number, GD-001 and up</li>
        <li><b>YOURS TO WEAR</b> own one and it unlocks here in THE MAKER</li>
        <li><b>???</b> one GOLDEN TICKET is hiding in there</li>
      </ul>
      <div class="cp-actions">
        <a class="cp-go mono" href="crate.html">GO TO THE CRATE →</a>
        <a class="cp-later mono" href="good-crate.html">HOW IT WORKS</a>
        <button type="button" class="cp-later mono" data-close>NOT NOW</button>
      </div>
      <p class="cp-fine mono">GOOD® COINS: +10 A DAY WHEN YOU SAVE A NEW FIT TO YOUR WARDROBE.</p>
    </section>`;
  document.body.append(modal);

  const app = () => window.GoodApp;
  function open() { modal.hidden = false; app() && app().setModalOpen && app().setModalOpen(true); modal.querySelector('.cp-go').focus(); remember(); }
  function close() { modal.hidden = true; app() && app().setModalOpen && app().setModalOpen(false); }
  btn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  if (!seen) setTimeout(() => { if (document.querySelector('.help-modal:not([hidden]), .rw-modal:not([hidden])')) return; open(); }, 2500);
})();
