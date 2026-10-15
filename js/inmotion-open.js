// ART® IN MOTION (/inmotion): open the GOOD® CRATE Nº002. Coins, ARE YOU SURE?, the reel
// and the reveal. The roll happens on the server (POST /api/crate { action: 'open', crate: 2 });
// this page only shows the result. Pieces stay locked in THE MAKER until you pull them.
(() => {
  const $ = (id) => document.getElementById(id);
  const btn = $('open'), again = $('again'), wallet = $('wallet'), drop = $('drop');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const coin = '<span class="coin" aria-hidden="true"></span>';
  const TIER = { chase: 'THE CHASE', rare: 'RARE', core: 'THE COLLECTION' };
  const pct = (p) => `${String(p).replace(/\.0$/, '')}%`;
  let me = null, table = [], price = 5, state = 'idle', sureT;

  function drawButton() {
    clearTimeout(sureT);
    btn.classList.toggle('im-sure', state === 'sure');
    if (!me) { btn.disabled = false; btn.textContent = 'SIGN IN TO OPEN'; wallet.innerHTML = '<a href="account">SIGN IN</a> TO COLLECT GOOD® COINS AND OPEN THE CRATE'; return; }
    wallet.innerHTML = `${me.name} · YOU HAVE ${coin}${me.coins} GOOD® COINS`;
    if (state === 'busy') { btn.disabled = true; btn.textContent = 'OPENING…'; return; }
    if (me.coins < price) { btn.disabled = true; btn.textContent = `NEED ${price} GOOD® COINS`; wallet.innerHTML += ' · SAVE NEW FITS IN THE MAKER: +10 EACH, 4 A DAY'; return; }
    btn.disabled = false;
    if (state === 'sure') {
      btn.textContent = 'ARE YOU SURE?';
      wallet.innerHTML = `OPENING COSTS ${coin}${price} GOOD® COINS. CLICK AGAIN TO OPEN.`;
      sureT = setTimeout(() => { state = 'idle'; drawButton(); }, 5000);
      return;
    }
    btn.textContent = `OPEN THE CRATE · ${price} GOOD® COINS`;
  }

  // The reel: ~60 cards weighted by the odds, the winner at card 50, slowing under the marker.
  function reelCard(it) {
    const c = document.createElement('div');
    c.className = `im-reel-card im-t-${it.tier}`;
    const cv = document.createElement('canvas'); c.append(cv); GoodItems.draw(it, cv).catch(() => {});
    const n = document.createElement('span'); n.className = 'sc'; n.textContent = `${it.name} ${it.color}`; c.append(n);
    return c;
  }
  function weighted(pool) {
    const total = pool.reduce((a, t) => a + t.pct, 0);
    let r = Math.random() * total;
    for (const t of pool) { r -= t.pct; if (r < 0) return t; }
    return pool[pool.length - 1];
  }
  async function spin(winnerId) {
    const reel = $('reel'), strip = $('strip');
    reel.hidden = false;
    const N = 60, WIN = 50;
    const cards = Array.from({ length: N }, (_, i) => (i === WIN ? table.find((t) => t.id === winnerId) : weighted(table)));
    strip.replaceChildren(...cards.map(reelCard));
    strip.getAnimations().forEach((a) => a.cancel());
    strip.style.transform = 'translateX(0)';
    await new Promise(requestAnimationFrame);
    const card = strip.children[WIN], step = strip.children[1].offsetLeft - strip.children[0].offsetLeft;
    const jitter = (Math.random() - 0.5) * card.offsetWidth * 0.7;
    const x = -(card.offsetLeft + card.offsetWidth / 2 - reel.clientWidth / 2 + jitter);
    const anim = strip.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${x}px)` }],
      { duration: reduce ? 1 : 6200, easing: 'cubic-bezier(0.1, 0.55, 0.08, 1)', fill: 'forwards' });
    let lastIdx = -1;
    const tick = () => {
      if (anim.playState !== 'running') return;
      const m = new DOMMatrix(getComputedStyle(strip).transform).m41;
      const idx = Math.round((reel.clientWidth / 2 - m - card.offsetWidth / 2) / step);
      if (idx !== lastIdx && strip.children[idx]) { strip.children[lastIdx]?.classList.remove('im-under'); strip.children[idx].classList.add('im-under'); lastIdx = idx; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await anim.finished;
    strip.children[lastIdx]?.classList.remove('im-under');
    card.classList.add('im-won');
    await wait(900);
  }

  async function openCrate() {
    state = 'busy'; drawButton(); again.disabled = true;
    const r = await fetch('api/crate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'open', crate: 2 }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      state = 'idle'; again.disabled = false;
      if (typeof j.coins === 'number') me.coins = j.coins;
      drawButton();
      wallet.innerHTML = j.error === 'coins' ? `NOT ENOUGH GOOD® COINS. YOU HAVE ${coin}${me.coins}.` : j.error === 'signed_out' ? 'SIGN IN FIRST.' : 'COULDN’T OPEN IT. TRY AGAIN.';
      return;
    }
    const roll = j.roll, item = table.find((t) => t.id === roll.item) || roll;
    drop.hidden = false; document.body.classList.add('im-dropping');
    $('got').hidden = true; $('dropTag').textContent = 'OPENING…';
    await spin(roll.item);
    await wait(400);
    $('reel').hidden = true;
    $('dropTag').textContent = 'YOU UNBOXED';
    const fig = $('gotFig'); fig.className = item.bottom ? 'im-fig-b' : item.accessory ? 'im-fig-a' : '';
    GoodItems.draw(item, fig).catch(() => {});
    $('gotName').replaceChildren(item.name, Object.assign(document.createElement('span'), { className: 'im-got-c sc', textContent: item.color }));
    $('gotSerial').textContent = roll.serial;
    $('gotMeta').innerHTML = `${TIER[item.tier]} · ${pct(item.pct)} · ADDED TO MY INVENTORY® AND UNLOCKED IN THE MAKER${roll.dup ? ` · YOU ALREADY HAD ONE: +${roll.refund} ${coin} REFUNDED` : ''}`;
    $('got').hidden = false;
    me.coins = j.coins;
    document.querySelectorAll('[data-acct]').forEach((a) => { a.innerHTML = `${me.name} · ${coin}${me.coins}`; });
    state = 'idle'; drawButton(); again.disabled = false;
    again.textContent = me.coins >= price ? `OPEN ANOTHER · ${price} GOOD® COINS` : `NEED ${price} GOOD® COINS`;
    again.disabled = me.coins < price;
  }

  btn.onclick = () => {
    if (!me) { location.href = 'account'; return; }
    if (state === 'idle') { state = 'sure'; drawButton(); return; }
    if (state === 'sure') openCrate();
  };
  again.onclick = () => { if (state === 'idle') openCrate(); };
  const close = () => { drop.hidden = true; document.body.classList.remove('im-dropping'); };
  $('dropClose').onclick = close;
  drop.addEventListener('click', (e) => { if (e.target === drop) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drop.hidden && state !== 'busy') close(); });

  Promise.all([
    fetch('api/crate?crate=2').then((r) => r.json()),
    fetch('api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })),
  ]).then(([c, m]) => {
    table = c.items || []; price = c.price || 5;
    me = m.user; drawButton();
  }).catch(() => { wallet.textContent = 'THE CRATE IS RESTING. TRY AGAIN SOON.'; });
})();
