// GOOD® CRATE: the odds, the coins, ARE YOU SURE?, and the reveal. The roll
// itself happens on the server (/api/crate); this page only shows the result.
(() => {
  const $ = (id) => document.getElementById(id);
  const btn = $('open'), wallet = $('wallet');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  let me = null, table = [], price = 5, refund = 2, state = 'idle', sureT;

  const TIER = { gold: 'GOLD ROLL', ticket: '???', rare: 'RARE', runway: 'RUNWAY®' };
  const pct = (p) => `${p < 1 ? p.toFixed(1) : String(p).replace(/\.0$/, '')}%`;
  const coin = '<span class="coin" aria-hidden="true"></span>';

  function drawNav() {
    document.querySelectorAll('[data-acct]').forEach((a) => {
      a.innerHTML = me ? `${me.name} · ${coin}${me.coins}` : 'SIGN IN';
    });
  }
  function drawButton() {
    clearTimeout(sureT);
    btn.classList.toggle('cr-sure', state === 'sure');
    if (!me) { btn.disabled = false; btn.textContent = 'SIGN IN TO OPEN'; wallet.innerHTML = 'SIGN IN WITH YOUR EMAIL TO GET GOOD® COINS.'; return; }
    wallet.innerHTML = `YOU HAVE ${coin}${me.coins} GOOD® COINS`;
    if (state === 'busy') { btn.disabled = true; btn.textContent = 'OPENING…'; return; }
    if (me.coins < price) { btn.disabled = true; btn.textContent = `NEED ${price} GOOD® COINS`; wallet.innerHTML += ' · SAVE A NEW FIT IN THE MAKER FOR +10 A DAY'; return; }
    btn.disabled = false;
    if (state === 'sure') {
      btn.textContent = 'ARE YOU SURE?';
      wallet.innerHTML = `OPENING COSTS ${coin}${price} GOOD® COINS. CLICK AGAIN TO OPEN.`;
      sureT = setTimeout(() => { state = 'idle'; drawButton(); }, 5000);
      return;
    }
    btn.textContent = `OPEN THE CRATE · ${price} GOOD® COINS`;
  }

  // CONTAINS: every piece, flat, with its odds per crate.
  function drawContents() {
    const row = $('contents');
    row.replaceChildren(...table.map((it) => {
      const card = document.createElement('div');
      card.className = `cr-card cr-t-${it.tier}`;
      card.innerHTML = `<canvas class="cr-card-fig${it.bottom ? ' cr-fig-b' : ''}${it.id === 'golden-ticket' ? ' cr-fig-t' : ''}" aria-hidden="true"></canvas>
        <span class="cr-card-n"></span><span class="cr-card-c mono"></span>
        <span class="cr-card-r mono"><b>${pct(it.pct)}</b> ${TIER[it.tier]}${it.chase ? ' · THE CHASE' : ''}</span>`;
      card.querySelector('.cr-card-n').textContent = it.name;
      card.querySelector('.cr-card-c').textContent = it.color;
      GoodItems.draw(it, card.querySelector('canvas')).catch(() => {});
      return card;
    }));
  }

  async function openCrate() {
    state = 'busy'; drawButton();
    $('drop').hidden = true;
    const r = await fetch('api/crate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'open' }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      state = 'idle';
      if (typeof j.coins === 'number') me.coins = j.coins;
      drawButton();
      wallet.innerHTML = j.error === 'coins' ? `NOT ENOUGH GOOD® COINS. YOU HAVE ${coin}${me.coins}.` : j.error === 'signed_out' ? 'SIGN IN FIRST.' : 'COULDN’T OPEN IT. TRY AGAIN.';
      return;
    }
    const roll = j.roll, item = table.find((t) => t.id === roll.item) || roll;
    window.GoodCrate && GoodCrate.open();
    await wait(1400);
    const drop = $('drop'); drop.hidden = false; drop.className = `cr-drop cr-t-${roll.tier}`;
    $('got').hidden = true; $('gold').hidden = true;
    drop.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    if (roll.gold) {
      // Gold roll: spin between the three I'M SOWWY pieces, slowing down, then land.
      $('dropTag').textContent = 'GOLD!';
      $('gold').hidden = false;
      const names = table.filter((t) => t.tier === 'gold').map((t) => `${t.name} ${t.color}`);
      const final = `${item.name} ${item.color}`;
      let delay = 60;
      for (let i = 0; i < (reduce ? 0 : 16); i++) { $('goldName').textContent = names[i % names.length]; await wait(delay); delay *= 1.16; }
      $('goldName').textContent = final;
      await wait(700);
    }
    $('dropTag').textContent = roll.tier === 'ticket' ? 'YOU FOUND' : 'YOU UNBOXED';
    const fig = $('gotFig'); fig.className = `cr-got-fig${item.bottom ? ' cr-fig-b' : ''}${roll.item === 'golden-ticket' ? ' cr-fig-t' : ''}`;
    GoodItems.draw(item, fig).catch(() => {});
    $('gotName').innerHTML = ''; $('gotName').append(item.name + ' ', Object.assign(document.createElement('span'), { textContent: item.color }));
    $('gotSerial').textContent = roll.serial;
    $('gotMeta').innerHTML = `${TIER[roll.tier]} · ${pct(item.pct)} · ADDED TO MY INVENTORY®${roll.dup ? ` · YOU ALREADY HAD ONE: +${roll.refund} ${coin} REFUNDED` : ''}`;
    $('got').hidden = false;
    me.coins = j.coins; drawNav();
    state = 'idle'; drawButton();
    btn.textContent = `OPEN ANOTHER · ${price} GOOD® COINS`;
    setTimeout(() => window.GoodCrate && GoodCrate.reset(), 2500);
  }

  btn.onclick = () => {
    if (!me) { location.href = 'account.html'; return; }
    if (state === 'idle') { state = 'sure'; drawButton(); return; }
    if (state === 'sure') openCrate();
  };

  Promise.all([
    fetch('api/crate').then((r) => r.json()),
    fetch('api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })),
  ]).then(([c, m]) => {
    table = c.items || []; price = c.price || 5; refund = c.refund || 2;
    me = m.user; drawNav(); drawContents(); drawButton();
  }).catch(() => { wallet.textContent = 'THE CRATE IS RESTING. TRY AGAIN SOON.'; });
})();
