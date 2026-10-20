// MOBILE® REVAMPED®: on phones MAKER® keeps the player on screen. The model holds the
// top of the screen; the fit sits in a panel under it, one tab at a time (SHIRT ·
// PANTS · SHOE · ACC.), with the cards in a strip you swipe sideways. Pull the panel
// up for a full grid. YOUR SKIN opens as a sheet; GOOD® ME floats on the stage; SAVE
// TO WARDROBE and SHARE stay under your thumb. Desktop is untouched: everything here
// only shows under 701px, and the pieces it moves go back when the screen widens.
(() => {
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const right = document.querySelector('.right-col'), panel = document.querySelector('.panel.right');
  const left = document.querySelector('.panel.left'), stage = document.querySelector('.viewer-wrap');
  if (!right || !panel || !left || !stage) return;
  body.classList.add('m-maker');   // the phone styles in style.css apply only here
  const mq = matchMedia('(max-width: 700px)');

  // ---------- Tabs (with the pull handle) ----------
  const tabs = document.createElement('div');
  tabs.className = 'm-tabs mono';
  tabs.innerHTML = '<span class="m-handle" aria-hidden="true"></span><div class="m-tablist" role="tablist" aria-label="Pick a piece">'
    + [['shirt', 'SHIRT'], ['pants', 'PANTS'], ['shoe', 'SHOE'], ['acc', 'ACC.']].map(([k, l]) => `<button type="button" role="tab" data-mtab="${k}">${l}</button>`).join('')
    + '</div><button type="button" class="m-grow" aria-expanded="false" aria-label="Show every piece">⌃</button>';
  right.prepend(tabs);
  const tabBtn = (k) => tabs.querySelector(`[data-mtab="${k}"]`);
  function setTab(k) {
    body.dataset.mtab = k;
    tabs.querySelectorAll('[data-mtab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mtab === k)));
    panel.scrollTop = 0;
  }
  tabs.querySelector('.m-tablist').onclick = (e) => { const b = e.target.closest('[data-mtab]'); if (b) setTab(b.dataset.mtab); };
  // SHOE and ACC. only when there is something to pick
  function syncTabs() {
    const shoe = $('shoeSection'), acc = $('accSection');
    tabBtn('shoe').hidden = !shoe || shoe.hidden;
    tabBtn('acc').hidden = !acc;
    if (tabBtn(body.dataset.mtab || 'shirt').hidden) setTab('pants');
  }
  setTab('shirt');
  new MutationObserver(syncTabs).observe(panel, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
  syncTabs();

  // ---------- Pull up / down ----------
  const grow = tabs.querySelector('.m-grow');
  function setOpen(open) {
    body.classList.toggle('m-open', open);
    grow.setAttribute('aria-expanded', String(open));
    grow.setAttribute('aria-label', open ? 'Back to the strip' : 'Show every piece');
  }
  grow.onclick = () => setOpen(!body.classList.contains('m-open'));
  let y0 = null;
  tabs.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
  tabs.addEventListener('touchend', (e) => {
    if (y0 === null) return;
    const dy = e.changedTouches[0].clientY - y0; y0 = null;
    if (dy < -30) setOpen(true); else if (dy > 30) setOpen(false);
  });

  // ---------- On the stage: body type, YOUR SKIN, GOOD® ME ----------
  const ctr = document.createElement('div');
  ctr.className = 'm-stage';
  ctr.innerHTML = '<div class="m-body mono" role="radiogroup" aria-label="Body type"><button type="button" role="radio" data-b="classic">CLASSIC</button><button type="button" role="radio" data-b="slim">SLIM</button></div>'
    + '<button type="button" class="m-skin mono">YOUR SKIN</button>'
    + '<button type="button" class="m-dl" aria-label="Download your skin: GOOD® ME">↓</button>';
  stage.append(ctr);
  ctr.querySelector('.m-body').onclick = (e) => { const b = e.target.closest('[data-b]'); if (b) $('body').querySelector(`[data-body="${b.dataset.b}"]`)?.click(); };
  const syncBody = () => ctr.querySelectorAll('[data-b]').forEach((b) => b.setAttribute('aria-checked', $('body').querySelector(`[data-body="${b.dataset.b}"]`)?.getAttribute('aria-checked') || 'false'));
  new MutationObserver(syncBody).observe($('body'), { subtree: true, attributes: true, attributeFilter: ['aria-checked'] });
  syncBody();
  ctr.querySelector('.m-dl').onclick = () => $('download').click();

  // YOUR SKIN: the left panel as a sheet over everything, with DONE
  const done = document.createElement('button');
  done.type = 'button'; done.className = 'm-done mono'; done.textContent = 'DONE';
  left.prepend(done);
  const you = (open) => { body.classList.toggle('m-you', open); if (open) left.scrollTop = 0; };
  ctr.querySelector('.m-skin').onclick = () => you(true);
  done.onclick = () => you(false);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('m-you')) you(false); });

  // ---------- The bar: SAVE TO WARDROBE + SHARE ----------
  const bar = document.createElement('div');
  bar.className = 'm-bar';
  const share = document.createElement('button');
  share.type = 'button'; share.className = 'm-share'; share.setAttribute('aria-label', 'Share this fit'); share.textContent = '↗';
  share.onclick = async () => {
    const url = location.href;
    try { if (navigator.share) { await navigator.share({ title: 'My fit · MAKER® · GOOD®', url }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(url); share.textContent = '✓'; setTimeout(() => { share.textContent = '↗'; }, 1400); } catch {}
  };
  const save = $('saveLook'), saveHome = save.nextElementSibling;
  // Move SAVE TO WARDROBE into the bar on phones, and back on wider screens.
  function place() {
    const m = mq.matches;
    if (m && save.parentNode !== bar) { bar.append(save, share); right.append(bar); }
    if (!m && save.parentNode === bar) { right.insertBefore(save, saveHome); bar.remove(); setOpen(false); you(false); }
    // the stage sits under the header, however tall it wraps
    const h = document.querySelector('.site-header');
    if (h) document.documentElement.style.setProperty('--mh', `${h.offsetHeight}px`);
  }
  mq.addEventListener('change', place);
  addEventListener('resize', place);
  place();
})();
