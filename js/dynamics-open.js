// DYNAMICS® I (/dynamics): open the GOOD® CRATE Nº003. Coins, ARE YOU SURE?, the carry-on
// opening (js/dynamics-crate.js), the reel and the reveal. The roll happens on the server
// (POST /api/crate { action: 'open', crate: 3 }); this page only shows the result. Pieces stay
// locked in MAKER® until you pull them. (From js/inmotion-open.js.)
(() => {
  // One /api/me per page load, shared by every script that needs it.
  const meOnce = () => (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })));
  const $ = (id) => document.getElementById(id);
  const btn = $('open'), again = $('again'), wallet = $('wallet'), drop = $('drop');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));   // the unboxing plays for everyone
  const coin = '<span class="coin" aria-hidden="true"></span>';
  const TIER = (it) => (it.tier === 'chase' ? 'THE CHASE' : it.tier === 'rare' ? 'TARMAC® AVANT-GARDE' : it.line === 'tarmac' ? 'TARMAC® ESSENTIALS' : 'DYNAMICS®');
  const tm = (c) => c.split('/').map((x) => (/GOOD®/.test(x) ? x : `${x}™`)).join('/');   // colour names take ™
  const pct = (p) => `${Math.round(p * 10) / 10}%`;
  let me = null, table = [], price = 5, state = 'idle', sureT;

  function drawButton() {
    clearTimeout(sureT);
    btn.classList.toggle('gd-sure', state === 'sure');
    if (!me) { btn.disabled = false; btn.textContent = 'SIGN IN TO OPEN'; wallet.innerHTML = '<a href="/account">SIGN IN</a> TO COLLECT GOOD® COINS AND OPEN THE CRATE'; return; }
    wallet.innerHTML = `${me.name} · YOU HAVE ${coin}${me.coins} GOOD® COINS`;
    if (state === 'busy') { btn.disabled = true; btn.textContent = 'OPENING…'; return; }
    if (me.coins < price) { btn.disabled = true; btn.textContent = `NEED ${price} GOOD® COINS`; wallet.innerHTML += ' · SAVE NEW FITS IN MAKER®: +10 EACH, 4 A DAY'; return; }
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
    c.className = `gd-reel-card gd-t-${it.tier}`;
    const cv = document.createElement('canvas'); c.append(cv); GoodItems.draw(it, cv).catch(() => {});
    const n = document.createElement('span'); n.className = 'mono'; n.textContent = `${it.name} ${tm(it.color)}`; c.append(n);
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
      { duration: 6200, easing: 'cubic-bezier(0.1, 0.55, 0.08, 1)', fill: 'forwards' });
    let lastIdx = -1;
    const tick = () => {
      if (anim.playState !== 'running') return;
      const m = new DOMMatrix(getComputedStyle(strip).transform).m41;
      const idx = Math.round((reel.clientWidth / 2 - m - card.offsetWidth / 2) / step);
      if (idx !== lastIdx && strip.children[idx]) { strip.children[lastIdx]?.classList.remove('gd-under'); strip.children[idx].classList.add('gd-under'); lastIdx = idx; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await anim.finished;
    strip.children[lastIdx]?.classList.remove('gd-under');
    card.classList.add('gd-won');
    await wait(900);
  }

  async function openCrate() {
    state = 'busy'; drawButton(); again.disabled = true;
    const r = await fetch('/api/crate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'open', crate: 3 }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      state = 'idle'; again.disabled = false;
      if (typeof j.coins === 'number') me.coins = j.coins;
      drawButton();
      wallet.innerHTML = j.error === 'coins' ? `NOT ENOUGH GOOD® COINS. YOU HAVE ${coin}${me.coins}.` : j.error === 'signed_out' ? 'SIGN IN FIRST.' : 'COULDN’T OPEN IT. TRY AGAIN.';
      return;
    }
    const roll = j.roll, item = table.find((t) => t.id === roll.item) || roll;
    if (window.DynCrate && drop.hidden) { $('crate3d').scrollIntoView({ behavior: 'smooth', block: 'center' }); window.DynCrate.open(); await wait(window.DynCrate.duration + 200); }
    drop.hidden = false; document.body.classList.add('gd-dropping');
    $('got').hidden = true; $('dropTag').textContent = 'OPENING…';
    await spin(roll.item);
    await wait(400);
    $('reel').hidden = true;
    $('dropTag').textContent = 'YOU UNBOXED';
    const fig = $('gotFig'); fig.className = item.bottom ? 'gd-fig-b' : item.accessory ? 'gd-fig-a' : '';
    GoodItems.draw(item, fig).catch(() => {});
    $('gotName').replaceChildren(item.name, Object.assign(document.createElement('span'), { className: 'gd-got-c mono', textContent: tm(item.color) }));
    $('gotSerial').textContent = roll.serial;
    $('gotMeta').innerHTML = `${TIER(item)} · ${pct(item.pct)} · ADDED TO MY INVENTORY® AND UNLOCKED IN MAKER®${roll.dup ? ` · YOU ALREADY HAD ONE: +${roll.refund} ${coin} REFUNDED` : ''}`;
    if ((j.achievements || []).length) $('gotMeta').innerHTML += j.achievements.map((a) => `<br><b class="gd-ach">★ ACHIEVEMENT UNLOCKED: ${a.name}</b>`).join('');
    $('got').hidden = false;
    me.coins = j.coins;
    window.GoodNav?.update(me);
    state = 'idle'; drawButton(); again.disabled = false;
    again.textContent = me.coins >= price ? `OPEN ANOTHER · ${price} GOOD® COINS` : `NEED ${price} GOOD® COINS`;
    again.disabled = me.coins < price;
  }

  // 03 THE ITEMS: every piece in the crate, drawn flat in its spotlight, with its odds. TARMAC®
  // (essentials, then avant-garde), DYNAMICS®, then the two chase sets.
  function drawItems() {
    const card = (it) => {
      const f = document.createElement('figure'); f.className = `gd-item gd-t-${it.tier}`;
      f.innerHTML = '<canvas aria-hidden="true"></canvas><figcaption><span class="p"></span><span class="c"></span><span class="r"></span></figcaption>';
      f.querySelector('.p').textContent = it.name;
      f.querySelector('.c').textContent = tm(it.color);
      f.querySelector('.r').textContent = `${pct(it.pct)} · ${TIER(it)}`;
      f.querySelector('canvas').addEventListener('contextmenu', (e) => e.preventDefault());
      GoodItems.draw(it, f.querySelector('canvas')).catch(() => {});
      return f;
    };
    const rank = { core: 0, rare: 1 };
    $('itemsTar')?.replaceChildren(...table.filter((i) => i.line === 'tarmac' && i.tier !== 'chase').sort((a, b) => rank[a.tier] - rank[b.tier]).map(card));
    $('itemsDyn')?.replaceChildren(...table.filter((i) => i.line === 'dynamics' && i.tier !== 'chase').map(card));
    $('itemsChase')?.replaceChildren(...table.filter((i) => i.tier === 'chase').map(card));
    if ($('itemsCount')) $('itemsCount').textContent = `${table.length} PIECES · ODDS PER CRATE`;
  }

  btn.onclick = () => {
    if (!me) { location.href = '/account'; return; }
    if (state === 'idle') { state = 'sure'; drawButton(); return; }
    if (state === 'sure') openCrate();
  };
  again.onclick = () => { if (state === 'idle') openCrate(); };
  const close = () => { drop.hidden = true; document.body.classList.remove('gd-dropping'); window.DynCrate?.reset(); };
  $('dropClose').onclick = close;
  drop.addEventListener('click', (e) => { if (e.target === drop) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drop.hidden && state !== 'busy') close(); });

  Promise.all([
    fetch('/api/crate?crate=3').then((r) => r.json()),
    meOnce(),
  ]).then(([c, m]) => {
    table = c.items || []; price = c.price || 5;
    drawItems();
    me = m.user; drawButton();
  }).catch(() => { wallet.textContent = 'THE CRATE IS RESTING. TRY AGAIN SOON.'; });
})();
