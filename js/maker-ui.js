// MAKER® helpers from the UX overhaul:
// - the three steps over the stage (1 YOUR SKIN → 2 PICK PIECES → 3 DOWNLOAD OR SAVE), lit as
//   you go, gone once you've downloaded or saved (or pressed GOT IT), remembered per browser;
// - the filter row over the pieces (ALL · THE BASICS · NEW · CRATES ▾ · DROPS ▾ · BABY® · OWNED ONLY).
(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = 'good-steps-done';
  const seen = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
  const steps = $('mkSteps');
  if (steps && !seen()) {
    steps.hidden = false; document.body.classList.add('has-steps');
    const li = steps.querySelectorAll('li:not(.mk-steps-x)');
    const at = (n) => li.forEach((e, i) => { e.classList.toggle('on', i === n); e.classList.toggle('done', i < n); });
    at(0);
    const finish = () => { try { localStorage.setItem(KEY, '1'); } catch {} steps.hidden = true; document.body.classList.remove('has-steps'); };
    $('mkStepsX').onclick = finish;
    // 1 → 2 once there's a real skin (not the demo); 2 → 3 once a piece is picked
    const sub = $('uploadSub');
    const skinIn = () => sub && !/DEMO/.test(sub.textContent);
    let picked = false;
    const sync = () => at(!skinIn() ? 0 : !picked ? 1 : 2);
    if (sub) new MutationObserver(sync).observe(sub, { childList: true, characterData: true, subtree: true });
    document.querySelector('.panel.right')?.addEventListener('click', (e) => { if (e.target.closest('.outfit')) { picked = true; sync(); } });
    $('download')?.addEventListener('click', finish);
    $('saveLook')?.addEventListener('click', finish);
  }

  // The filter row, at the top of the pieces: quiet text, the one that's on underlined.
  //   ALL · THE BASICS · <newest> NEW · CRATES ▾ · DROPS ▾ · BABY® · (YOURS ▾)      ○ OWNED ONLY
  // A ▾ opens a small menu. app.js keeps the filters (GoodApp.filters / setFilter) and says when
  // they change ('good:filters'), e.g. when a drop arrives after boot.
  const panel = document.querySelector('.panel.right');
  const App = window.GoodApp;
  if (panel && App && App.filters) {
    const MENUS = [['CRATES', ['crate3', 'crate2', 'crate1']], ['DROPS', ['qg', 'fall', 'deep', 'gud', 'wandering']], ['YOURS', ['house', 'friday', 'core', 'private']]];
    const SOLO = ['all', 'basics'];
    const row = document.createElement('nav'); row.className = 'mk-row mono'; row.setAttribute('aria-label', 'Show');
    const menu = document.createElement('div'); menu.className = 'mk-menu mono'; menu.hidden = true; document.body.append(menu);
    let owned = false;
    try { owned = localStorage.getItem('good-hide-locked') === '1'; } catch {}
    if (owned) setTimeout(() => App.hideLocked(true), 0);
    const btn = (label, on, onClick, extra = '') => {
      const b = document.createElement('button'); b.type = 'button'; b.innerHTML = label + extra;
      if (on) b.setAttribute('aria-current', 'true');
      b.onclick = onClick; return b;
    };
    const closeMenu = () => { menu.hidden = true; row.querySelectorAll('[aria-expanded]').forEach((b) => b.setAttribute('aria-expanded', 'false')); };
    const draw = () => {
      const { names, on, lead } = App.filters();
      const has = (v) => v in names;
      const items = [];
      for (const v of SOLO) items.push(btn(names[v], on === v, () => App.setFilter(v)));
      if (lead && has(lead)) items.push(btn(names[lead], on === lead, () => App.setFilter(lead), '<sup>NEW</sup>'));
      // anything that arrives without a home goes under DROPS
      const placed = new Set([...SOLO, 'baby', 'current', lead, ...MENUS.flatMap(([, v]) => v)]);
      const menus = MENUS.map(([t, v]) => [t, v.filter((x) => x !== lead && has(x))]);
      menus[1][1].push(...Object.keys(names).filter((x) => !placed.has(x)));
      for (const [title, vals] of menus) {
        if (!vals.length) continue;
        const cur = vals.includes(on);
        const b = btn(cur ? names[on] : title, cur, null, ' <span aria-hidden="true">▾</span>');
        b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false');
        b.onclick = (e) => {
          e.stopPropagation();
          if (!menu.hidden && b.getAttribute('aria-expanded') === 'true') return closeMenu();
          closeMenu();
          menu.replaceChildren(...vals.map((v) => btn(names[v], on === v, () => { closeMenu(); App.setFilter(v); })));
          const r = b.getBoundingClientRect();
          menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - 220))}px`; menu.style.top = `${r.bottom + 8}px`;
          menu.hidden = false; b.setAttribute('aria-expanded', 'true');
        };
        items.push(b);
      }
      if (has('baby')) items.push(btn(names.baby, on === 'baby', () => App.setFilter('baby')));
      const sp = document.createElement('span'); sp.className = 'mk-row-sp';
      const own = btn('OWNED ONLY', false, () => {
        owned = !owned;
        try { localStorage.setItem('good-hide-locked', owned ? '1' : ''); } catch {}
        App.hideLocked(owned); draw();
      });
      own.className = 'mk-owned'; own.setAttribute('aria-pressed', String(owned));
      row.replaceChildren(...items, sp, own);
    };
    document.addEventListener('good:filters', draw);
    document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) closeMenu(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    addEventListener('resize', closeMenu);
    panel.addEventListener('scroll', closeMenu, { passive: true });
    row.addEventListener('scroll', closeMenu, { passive: true });
    draw();
    panel.querySelector('.fit-cols')?.before(row);
  }
})();
