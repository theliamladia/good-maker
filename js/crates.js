// CRATES® (/crates): every GOOD® CRATE, with your balance and how much of each you've collected.
(() => {
  const coin = '<span class="coin" aria-hidden="true"></span>';
  const wallet = document.getElementById('wallet');
  const crate = (n) => fetch(n === '1' ? '/api/crate' : `/api/crate?crate=${n}`).then((r) => r.json()).then((c) => (c.items || []).filter((it) => it.tier !== 'ticket')).catch(() => []);
  Promise.all([fetch('/api/me', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})), crate('1'), crate('2'), crate('3')]).then(([me, ...lists]) => {
    window.GoodNav?.update(me && me.user);
    if (!me || !me.user) { wallet.innerHTML = '<a class="foot-link" href="account">SIGN IN</a> TO GET GOOD® COINS AND TRACK YOUR COLLECTION.'; return; }
    wallet.innerHTML = `YOU HAVE ${coin}${me.user.coins || 0} GOOD® COINS`;
    const owned = new Set((me.inventory || []).map((e) => e && e.item));
    for (const [i, list] of lists.entries()) {
      const el = document.querySelector(`.rl-crate-got[data-crate="${i + 1}"]`);
      if (!el || !list.length) continue;
      const n = list.filter((it) => owned.has(it.id)).length;
      el.textContent = `${Math.floor((n / list.length) * 100)}% COLLECTED · ${n} OF ${list.length}`;
      el.hidden = false;
    }
  });
})();
