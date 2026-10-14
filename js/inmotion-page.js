// ART® IN MOTION (/inmotion): the wallet, THE CHASE and every piece with its odds,
// from /api/crate?crate=2. The crate isn't open yet, so there's nothing to roll here.
(() => {
  const $ = (id) => document.getElementById(id);
  const TIER = { chase: 'THE CHASE', rare: 'RARE', core: '' };
  const pct = (p) => `${String(p).replace(/\.0$/, '')}%`;
  const coin = '<span class="coin" aria-hidden="true"></span>';

  fetch('api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })).then(({ user }) => {
    $('wallet').innerHTML = user
      ? `${user.name} · YOU HAVE ${coin}${user.coins || 0} GOOD® COINS`
      : '<a href="account">SIGN IN</a> TO COLLECT GOOD® COINS BEFORE IT OPENS';
  });

  fetch('api/crate?crate=2').then((r) => r.json()).then(({ items = [] }) => {
    const chase = items.find((i) => i.chase);
    if (chase) { $('chaseOdds').textContent = pct(chase.pct); GoodItems.draw(chase, $('chaseFig')).catch(() => {}); }
    $('insideCount').textContent = `${items.length} PIECES · ODDS PER CRATE`;
    // Rarest first, then the collection in its order.
    const order = { chase: 0, rare: 1, core: 2 };
    const sorted = [...items].sort((a, b) => order[a.tier] - order[b.tier]);
    $('inside').replaceChildren(...sorted.map((it) => {
      const card = document.createElement('figure');
      card.className = `im-card im-t-${it.tier}`;
      card.innerHTML = '<canvas aria-hidden="true"></canvas><figcaption><span class="im-card-n"></span><span class="im-card-c sc"></span><span class="im-card-r sc"></span></figcaption>';
      card.querySelector('.im-card-n').textContent = it.name;
      card.querySelector('.im-card-c').textContent = it.color;
      card.querySelector('.im-card-r').textContent = [pct(it.pct), TIER[it.tier]].filter(Boolean).join(' · ');
      GoodItems.draw(it, card.querySelector('canvas')).catch(() => {});
      return card;
    }));
  }).catch(() => {});
})();
