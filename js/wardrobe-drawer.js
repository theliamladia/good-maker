// MAKER®: your WARDROBE without leaving the page. Signed in, MY WARDROBE (under SAVE TO
// WARDROBE, and in YOUR SKIN on phones) opens a sheet of your saved fits, drawn on your home
// skin: pick one to put it on, or remove it (it asks first). Renaming and the rest stay on
// the account page. Needs js/compose.js (and js/ui.js for the two-step remove).
(() => {
  const $ = (id) => document.getElementById(id);
  const meOnce = () => (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })));
  const DEMO = 'samples/spurdo.png';
  const lookHref = ({ ft, ...L }) => `./?${new URLSearchParams(L)}`;
  let me = null, extrasLoaded = false;

  const sheet = document.createElement('div');
  sheet.className = 'wd-sheet'; sheet.hidden = true;
  sheet.innerHTML = `<div class="wd-back" data-close></div>
    <aside class="wd-panel" role="dialog" aria-modal="true" aria-labelledby="wdTitle">
      <header class="wd-head"><h2 class="mono" id="wdTitle">MY WARDROBE</h2><span class="mono" id="wdCount"></span><button type="button" class="wd-x mono" data-close aria-label="Close">✕</button></header>
      <p class="wd-note" id="wdEmpty" hidden>Nothing saved yet. Put on a fit and press SAVE TO WARDROBE: your first new fits each day earn GOOD® COINS.</p>
      <div class="wd-grid" id="wdGrid"></div>
      <a class="wd-more mono" href="account">RENAME AND MORE ON YOUR ACCOUNT PAGE →</a>
    </aside>`;
  document.body.append(sheet);
  const close = () => { sheet.hidden = true; document.body.classList.remove('wd-open'); };
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) close(); });

  const triggers = [];
  function trigger(where, cls) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `wd-open-btn mono ${cls}`; b.textContent = 'MY WARDROBE';
    b.onclick = open; where.append(b); triggers.push(b);
  }
  const count = (n) => triggers.forEach((b) => { b.textContent = `MY WARDROBE · ${n}`; });

  async function open() {
    sheet.hidden = false; document.body.classList.add('wd-open');
    sheet.querySelector('.wd-x').focus();
    const j = await fetch('/api/me', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!j || !j.user) { close(); return; }
    me = j.user;
    // The released drops' pieces and (owner and guests) the private ones, so every saved fit draws.
    if (!extrasLoaded) {
      extrasLoaded = true;
      const qs = ['gud=1', 'drop=wandering'].concat(me.owner || me.private ? ['private=1'] : []);
      for (const q of qs) { const cat = await fetch(`api/outfit?${q}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null); if (cat) GoodCompose.addPrivate(cat); }
    }
    let skin;
    try { skin = await GoodCompose.load(me.hasSkin ? `api/me?skin=1&t=${Date.now()}` : DEMO); } catch { skin = await GoodCompose.load(DEMO); }
    const list = j.wardrobe || [];
    $('wdCount').textContent = `${list.length} / 60`; count(list.length);
    $('wdEmpty').hidden = list.length > 0;
    $('wdGrid').replaceChildren(...list.map((w) => {
      const a = document.createElement('a');
      a.className = 'wd-card'; a.href = lookHref(w.look); a.hidden = true;
      a.innerHTML = '<span class="wd-fig"></span><span class="wd-title"></span><span class="wd-piece mono"></span><button type="button" class="wd-rm mono" aria-label="Remove from wardrobe">REMOVE</button>';
      a.querySelector('.wd-title').textContent = w.title || '';
      a.querySelector('.wd-rm').onclick = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!GoodUI.arm(e.currentTarget, 'REMOVE?')) return;
        try {
          const r = await fetch('api/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', id: w.id }) });
          if (!r.ok) throw new Error();
          a.remove(); const n = $('wdGrid').children.length; $('wdCount').textContent = `${n} / 60`; count(n); $('wdEmpty').hidden = n > 0;
        } catch { e.currentTarget.textContent = 'TRY AGAIN'; }
      };
      GoodCompose.compose(skin, w.look).then(({ merged, slim, top, bottom }) => {
        a.querySelector('.wd-fig').append(GoodCompose.front(merged, slim));
        a.querySelector('.wd-piece').textContent = [top && `${top.name} ${top.color}`, bottom && `${bottom.name} ${bottom.color}`].filter(Boolean).join(' + ');
        a.setAttribute('aria-label', `${[GoodCompose.label(top), GoodCompose.label(bottom)].filter(Boolean).join(' and ')}. Put it on.`);
        a.hidden = false;
      }).catch(() => a.remove());   // a retired piece
      return a;
    }));
  }

  meOnce().then((j) => {
    me = j.user;
    if (!me) return;
    const acts = document.querySelector('.mk-actions'), left = document.querySelector('.panel.left');
    if (acts) trigger(acts, 'wd-open-desk');
    if (left) trigger(left, 'wd-open-phone');
    count((j.wardrobe || []).length);
  });
})();
