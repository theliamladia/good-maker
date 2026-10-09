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
    await wait(900);
    const drop = $('drop'); drop.hidden = false; drop.className = 'cr-drop';
    $('got').hidden = true; $('gold').hidden = true;
    $('dropTag').textContent = 'OPENING…';
    drop.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    // The reel, like a Counter-Strike case: the I'M SOWWY pieces hide behind one ★ GOLD card.
    const main = table.filter((t) => t.tier !== 'gold');
    const goldPct = table.filter((t) => t.tier === 'gold').reduce((a, t) => a + t.pct, 0);
    await spin([...main, { id: 'GOLD', name: '★ GOLD ROLL', color: "I'M SOWWY", tier: 'gold', pct: goldPct }], roll.gold ? 'GOLD' : roll.item);
    if (roll.gold) {
      $('dropTag').textContent = '★ GOLD ROLL ★';
      drop.className = 'cr-drop cr-t-gold';
      await wait(600);
      await spin(table.filter((t) => t.tier === 'gold'), roll.item);
    }
    await wait(500);
    $('reel').hidden = true;
    drop.className = `cr-drop cr-t-${roll.tier}`;
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

  // One reel: a strip of ~60 cards, filler weighted by the odds, the winner at
  // card 50; it scrolls, slows like a case opening and stops under the marker.
  function reelCard(it) {
    const c = document.createElement('div');
    c.className = `cr-reel-card cr-t-${it.tier}`;
    if (it.id === 'GOLD') c.innerHTML = '<span class="cr-reel-star">★</span>';
    else { const cv = document.createElement('canvas'); c.append(cv); GoodItems.draw(it, cv).catch(() => {}); }
    const n = document.createElement('span'); n.className = 'cr-reel-n'; n.textContent = it.id === 'GOLD' ? '★ GOLD ROLL' : `${it.name} ${it.color}`;
    c.append(n);
    return c;
  }
  function weighted(pool) {
    const total = pool.reduce((a, t) => a + t.pct, 0);
    let r = Math.random() * total;
    for (const t of pool) { r -= t.pct; if (r < 0) return t; }
    return pool[pool.length - 1];
  }
  async function spin(pool, winnerId) {
    const reel = $('reel'), strip = $('strip');
    reel.hidden = false;
    const N = 60, WIN = 50;
    const cards = Array.from({ length: N }, (_, i) => (i === WIN ? pool.find((t) => t.id === winnerId) : weighted(pool)));
    strip.replaceChildren(...cards.map(reelCard));
    strip.getAnimations().forEach((a) => a.cancel());
    strip.style.transform = 'translateX(0)';
    await new Promise(requestAnimationFrame);
    const card = strip.children[WIN], step = strip.children[1].offsetLeft - strip.children[0].offsetLeft;
    const jitter = (Math.random() - 0.5) * card.offsetWidth * 0.7;
    const x = -(card.offsetLeft + card.offsetWidth / 2 - reel.clientWidth / 2 + jitter);
    const anim = strip.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${x}px)` }],
      { duration: reduce ? 1 : 6200, easing: 'cubic-bezier(0.1, 0.55, 0.08, 1)', fill: 'forwards' });
    // Tick: light up whichever card is under the marker as it passes.
    let lastIdx = -1;
    const tick = () => {
      if (anim.playState !== 'running') return;
      const m = new DOMMatrix(getComputedStyle(strip).transform).m41;
      const idx = Math.round((reel.clientWidth / 2 - m - card.offsetWidth / 2) / step);
      if (idx !== lastIdx && strip.children[idx]) { strip.children[lastIdx]?.classList.remove('cr-under'); strip.children[idx].classList.add('cr-under'); lastIdx = idx; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await anim.finished;
    strip.children[lastIdx]?.classList.remove('cr-under');
    card.classList.add('cr-won');
    await wait(900);
  }

  btn.onclick = () => {
    if (!me) { location.href = 'account'; return; }
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
