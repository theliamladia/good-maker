// GoodUI: the house dialog, in place of the browser's prompt() and confirm(), and the
// two-step button (first press asks, second press does it) used for small removals.
//   const name = await GoodUI.ask({ title: 'RENAME FIT', label: '…', value, max: 32 });   // string, or null
//   if (await GoodUI.confirm({ title: 'DELETE ACCOUNT?', body: '…', ok: 'DELETE', danger: true })) …
//   if (!GoodUI.arm(btn, 'REMOVE?')) return;   // in a click handler: true on the second press
(() => {
  function open({ title, body, label, value, max, ok = 'OK', cancel = 'CANCEL', danger = false, input = false, allowEmpty = false }) {
    return new Promise((resolve) => {
      const back = document.createElement('div');
      back.className = 'gu-modal';
      back.innerHTML = `<form class="gu-card" role="dialog" aria-modal="true" aria-labelledby="guTitle">
        <h2 class="gu-title mono" id="guTitle"></h2><p class="gu-body"></p>
        <label class="gu-field mono" hidden><span></span><input type="text" autocomplete="off" spellcheck="false"></label>
        <div class="gu-actions"><button type="button" class="gu-cancel mono"></button><button type="submit" class="gu-ok mono"></button></div>
      </form>`;
      const $ = (s) => back.querySelector(s);
      $('.gu-title').textContent = title || '';
      $('.gu-body').textContent = body || ''; $('.gu-body').hidden = !body;
      $('.gu-ok').textContent = ok; $('.gu-cancel').textContent = cancel;
      $('.gu-ok').classList.toggle('danger', danger);
      const field = $('.gu-field'), inp = $('input');
      if (input) {
        field.hidden = false; field.querySelector('span').textContent = label || '';
        inp.value = value || ''; if (max) inp.maxLength = max;
      }
      const prev = document.activeElement;
      const done = (v) => { back.remove(); document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); resolve(v); };
      const key = (e) => { if (e.key === 'Escape') done(input ? null : false); };
      $('.gu-cancel').onclick = () => done(input ? null : false);
      back.onclick = (e) => { if (e.target === back) done(input ? null : false); };
      $('form').onsubmit = (e) => {
        e.preventDefault();
        if (!input) return done(true);
        const v = inp.value.trim();
        if (!v && !allowEmpty) { inp.focus(); return; }
        done(v);
      };
      document.addEventListener('keydown', key);
      document.body.append(back);
      (input ? inp : $('.gu-ok')).focus();
      if (input) inp.select();
    });
  }
  const ask = (o) => open({ ok: 'SAVE', ...o, input: true });
  const confirm = (o) => open(o);

  // Two-step button: the first press swaps its label for the question for a few seconds.
  function arm(btn, question = 'ARE YOU SURE?', ms = 4000) {
    if (btn.dataset.armed) { clearTimeout(+btn.dataset.armed); delete btn.dataset.armed; btn.textContent = btn.dataset.label; btn.classList.remove('armed'); return true; }
    btn.dataset.label = btn.textContent; btn.textContent = question; btn.classList.add('armed');
    btn.dataset.armed = setTimeout(() => { delete btn.dataset.armed; btn.textContent = btn.dataset.label; btn.classList.remove('armed'); }, ms);
    return false;
  }
  window.GoodUI = { ask, confirm, arm };
})();
