// MAKER® helpers from the UX overhaul:
// - the three steps over the stage (1 YOUR SKIN → 2 PICK PIECES → 3 DOWNLOAD OR SAVE), lit as
//   you go, gone once you've downloaded or saved (or pressed GOT IT), remembered per browser;
// - the filter dropdowns as a row of chips on desktop (the dropdown stays the source of truth:
//   app.js listens to it, and adds options when a drop loads).
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

  // The filter bar, once, at the top of the pieces: one dropdown in groups (GOOD®, CRATES, COLLABS &
  // DROPS, YOURS) beside HIDE LOCKED. It drives the shirt and pants filters (one value for both).
  const sels = [...document.querySelectorAll('select[data-filter]')];
  const panel = document.querySelector('.panel.right');
  if (sels.length && panel) {
    const GROUPS = [['GOOD®', ['all', 'basics', 'fall', 'current']], ['CRATES', ['crate3', 'crate2', 'crate1']],
      ['COLLABS & DROPS', ['qg', 'deep', 'gud', 'wandering']], ['YOURS', ['core', 'private']]];
    const short = (t) => t.replace('GOOD® CRATE ', 'CRATE ').replace('CURRENT SEASON', 'THIS SEASON');
    const bar = document.createElement('div'); bar.className = 'mk-filterbar';
    bar.innerHTML = '<label class="mk-filter"><span class="mk-filter-l">SHOW</span><select class="mono" aria-label="Show"></select></label>'
      + '<label class="mk-hide-locked"><input type="checkbox"><span>HIDE LOCKED</span></label>';
    const pick = bar.querySelector('select'), box = bar.querySelector('input');
    const draw = () => {
      const opts = [...sels[0].options], placed = new Set();
      const groups = GROUPS.map(([label, vals]) => {
        const own = vals.map((v) => opts.find((o) => o.value === v)).filter(Boolean);
        if (!own.length) return null;
        const g = document.createElement('optgroup'); g.label = label;
        for (const o of own) { placed.add(o); g.append(new Option(short(o.textContent), o.value)); }
        return g;
      }).filter(Boolean);
      const rest = opts.filter((o) => !placed.has(o));   // anything new lands with the drops
      const drops = groups.find((g) => g.label === 'COLLABS & DROPS') || groups[groups.length - 1];
      for (const o of rest) drops.append(new Option(short(o.textContent), o.value));
      pick.replaceChildren(...groups); pick.value = sels[0].value;
    };
    pick.onchange = () => { sels[0].value = pick.value; sels[0].dispatchEvent(new Event('change')); };
    let hideLocked = false;
    try { hideLocked = localStorage.getItem('good-hide-locked') === '1'; } catch {}
    box.checked = hideLocked;
    if (hideLocked) setTimeout(() => window.GoodApp?.hideLocked(true), 0);
    box.onchange = () => { try { localStorage.setItem('good-hide-locked', box.checked ? '1' : ''); } catch {} window.GoodApp?.hideLocked(box.checked); };
    draw();
    for (const sel of sels) new MutationObserver(draw).observe(sel, { childList: true, attributes: true, attributeFilter: ['class'] });
    panel.querySelector('.fit-cols')?.before(bar);
  }

  // Desktop: GOOD®/BABY® first, above the SHIRT/PANTS tabs (on phones it stays in the sheet).
  const line = document.getElementById('line'), home = line && line.parentNode, after = line && line.nextSibling;
  const wide = matchMedia('(min-width: 701px)');
  const place = () => {
    const tabs = document.querySelector('.m-tabs');
    if (!line || !tabs) return;
    if (wide.matches) { tabs.before(line); line.classList.add('mk-line-top'); }
    else { home.insertBefore(line, after); line.classList.remove('mk-line-top'); }
  };
  place(); wide.addEventListener('change', place);
})();
