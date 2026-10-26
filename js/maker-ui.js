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

  // Filter chips (one value for both lists, so a press redraws every row)
  const draws = [];
  document.querySelectorAll('select[data-filter]').forEach((sel) => {
    const row = document.createElement('div');
    row.className = 'mk-chips'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', sel.getAttribute('aria-label') || 'Filter');
    const short = (t) => t.replace('GOOD® CRATE ', 'CRATE ').replace('CURRENT SEASON', 'THIS SEASON');
    const draw = () => {
      row.replaceChildren(...[...sel.options].map((o) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = short(o.textContent); b.setAttribute('aria-pressed', String(o.value === sel.value));
        b.onclick = () => { sel.value = o.value; sel.dispatchEvent(new Event('change')); draws.forEach((d) => d()); };
        return b;
      }));
    };
    draws.push(draw); draw();
    new MutationObserver(draw).observe(sel, { childList: true, attributes: true, attributeFilter: ['class'] });
    sel.closest('.section-tag').after(row);
  });
})();
