// MARKET® (/market): spare serialized copies listed for GOOD® COINS. The server does every
// check and moves the coins and the copy (POST /api/crate { action: 'list' | 'unlist' | 'buy' });
// this page shows the listings, your pieces, and asks ARE YOU SURE? before a purchase.
(() => {
  const $ = (id) => document.getElementById(id);
  const coin = '<span class="coin" aria-hidden="true"></span>';
  const meOnce = () => (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })));
  let me = null, inventory = [], items = {}, listings = [], sales = [];

  // Colour dots: each colour in the colourway, looked up by name in COLORS®.
  const HEX = Object.fromEntries((window.GOOD_COLORS || []).map((c) => [c.name.toUpperCase(), [].concat(c.hex)[0]]));
  const dots = (color) => String(color || '').split('/').map((n) => HEX[n.replace(/[™®ⓤ]/g, '').trim().toUpperCase()]).filter(Boolean)
    .map((h) => `<i style="background:${h}"></i>`).join('');

  let toastT;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }
  async function post(body) {
    const r = await fetch('api/crate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || 'failed'); e.code = j.error; e.coins = j.coins; throw e; }
    return j;
  }
  const ERR = { coins: 'NOT ENOUGH GOOD® COINS.', gone: 'SOMEONE GOT THERE FIRST.', busy: 'ONE MOMENT. TRY AGAIN.', price: 'PRICE: 1 TO 9999 GOOD® COINS.', too_many: 'TWENTY LISTINGS AT A TIME.', own_listing: 'THAT ONE IS YOURS.', slow_down: 'SLOW DOWN A LITTLE.', signed_out: 'SIGN IN FIRST.' };

  function piece(it, serial) {
    const f = document.createElement('figure');
    f.className = 'mk-card';
    f.innerHTML = '<div class="mk-spot"><canvas aria-hidden="true"></canvas></div><figcaption><b class="mk-name"></b><span class="mk-cw"><span class="mk-dots"></span><span class="mk-color"></span></span><span class="mk-meta mono"></span></figcaption>';
    f.querySelector('.mk-name').textContent = it ? it.name : 'GOOD® PIECE';
    f.querySelector('.mk-color').textContent = it ? it.color : '';
    f.querySelector('.mk-dots').innerHTML = it ? dots(it.color) : '';
    f.querySelector('.mk-meta').textContent = serial;
    const cv = f.querySelector('canvas');
    if (it) { cv.className = it.accessory ? 'mk-tall' : it.bottom ? 'mk-bottom' : ''; GoodItems.draw(it, cv).catch(() => {}); }
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    return f;
  }

  function drawWallet() {
    $('wallet').innerHTML = me ? `${me.name} · ${coin}${me.coins} GOOD® COINS` : '<a href="account">SIGN IN</a> TO BUY AND SELL';
    window.GoodNav?.update(me);
  }

  function drawListings() {
    const q = $('q').value.trim().toLowerCase();
    const rows = listings.filter((l) => {
      if (!q) return true;
      const it = items[l.item] || {};
      return `${it.name} ${it.color} ${l.seller} ${l.serial}`.toLowerCase().includes(q);
    });
    $('saleCount').textContent = `${listings.length} FOR SALE`;
    $('empty').hidden = listings.length > 0;
    $('listings').replaceChildren(...rows.map((l) => {
      const f = piece(items[l.item], l.serial);
      // The seller: their player head and name, linking to their profile.
      const who = document.createElement(l.sellerSlug ? 'a' : 'span');
      who.className = 'mk-seller mono';
      if (l.sellerSlug) who.href = `/profiles/${encodeURIComponent(l.sellerSlug)}`;
      const av = document.createElement('canvas'); av.className = 'mk-av'; av.setAttribute('aria-hidden', 'true');
      who.append(av, l.seller || 'GOOD®');
      GoodHeads.draw(av, l.sellerSkin && l.sellerSlug ? `api/profile?name=${encodeURIComponent(l.sellerSlug)}&skin=1` : null);
      f.querySelector('.mk-meta').after(who);
      const row = document.createElement('div'); row.className = 'mk-row';
      row.innerHTML = `<span class="mk-price mono">${coin}${l.price}</span>`;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mk-btn mono';
      if (l.mine) {
        b.textContent = 'UNLIST';
        b.onclick = async () => { b.disabled = true; try { await post({ action: 'unlist', lid: l.lid }); toast('BACK IN YOUR INVENTORY.'); await refresh(); } catch (e) { toast(ERR[e.code] || 'COULDN’T UNLIST. TRY AGAIN.'); b.disabled = false; } };
      } else if (!me) {
        b.textContent = 'SIGN IN TO BUY'; b.onclick = () => { location.href = 'account'; };
      } else {
        b.textContent = 'BUY';
        let sure = false, t;
        b.onclick = async () => {
          if (!sure) { sure = true; b.textContent = `ARE YOU SURE? ${l.price}`; b.classList.add('mk-sure'); t = setTimeout(() => { sure = false; b.textContent = 'BUY'; b.classList.remove('mk-sure'); }, 4000); return; }
          clearTimeout(t); b.disabled = true; b.textContent = 'BUYING…';
          try { const j = await post({ action: 'buy', lid: l.lid }); me.coins = j.coins; toast(`IT'S YOURS: ${l.serial}. NOW IN MY INVENTORY® AND MAKER®.`); await refresh(); }
          catch (e) { if (typeof e.coins === 'number') me.coins = e.coins; toast(ERR[e.code] || 'COULDN’T BUY IT. TRY AGAIN.'); await refresh(); }
        };
      }
      row.append(b); f.querySelector('figcaption').append(row);
      return f;
    }));
  }

  // Your pieces: every serialized copy from every GOOD® CRATE can be listed.
  function drawDoubles() {
    if (!me) { $('sellNote').innerHTML = '<a class="foot-link" href="account">Sign in</a> to list your pieces.'; $('doubles').replaceChildren(); return; }
    const count = {};
    for (const e of inventory) count[e.item] = (count[e.item] || 0) + 1;
    const spare = [...inventory].sort((a, b) => a.item.localeCompare(b.item) || (+a.serial.slice(3) || 0) - (+b.serial.slice(3) || 0));
    if (!spare.length) { $('doubles').replaceChildren(Object.assign(document.createElement('p'), { className: 'mk-empty', textContent: 'Nothing to sell yet. Every piece you pull from a GOOD® CRATE shows up here.' })); return; }
    $('doubles').replaceChildren(...spare.map((e) => {
      const f = piece(items[e.item], count[e.item] < 2 ? `${e.serial} · YOUR ONLY COPY` : e.serial);
      const row = document.createElement('form'); row.className = 'mk-row';
      row.innerHTML = `<label class="mk-set mono">${coin}<input type="number" min="1" max="9999" step="1" required aria-label="Price in GOOD® COINS" placeholder="PRICE"></label><button type="submit" class="mk-btn mono">LIST</button>`;
      row.onsubmit = async (ev) => {
        ev.preventDefault();
        const b = row.querySelector('button'); b.disabled = true;
        try { await post({ action: 'list', entry: e.id, price: +row.querySelector('input').value }); toast(count[e.item] < 2 ? `LISTED: ${e.serial}. IT LOCKS IN MAKER® UNTIL IT SELLS OR YOU UNLIST IT.` : `LISTED: ${e.serial}.`); await refresh(); }
        catch (err) { toast(ERR[err.code] || 'COULDN’T LIST IT. TRY AGAIN.'); b.disabled = false; }
      };
      f.querySelector('figcaption').append(row);
      return f;
    }));
  }

  function drawSold() {
    $('soldBlock').hidden = !sales.length;
    $('sold').replaceChildren(...sales.map((s) => {
      const it = items[s.item] || { name: s.item, color: '' };
      const li = document.createElement('li');
      li.innerHTML = `<span></span><span>${coin}${s.price}</span>`;
      li.firstChild.textContent = `${it.name} ${it.color} · ${s.serial}`;
      return li;
    }));
  }

  async function refresh() {
    const [m, mk] = await Promise.all([
      fetch('/api/me', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })),
      fetch('api/crate?market=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ listings: [], sales: [] })),
    ]);
    me = m.user; inventory = m.inventory || []; listings = mk.listings || []; sales = mk.sales || [];
    drawWallet(); drawListings(); drawDoubles(); drawSold();
  }

  $('q').addEventListener('input', drawListings);
  Promise.all([
    fetch('api/crate').then((r) => r.json()).catch(() => ({ items: [] })),
    fetch('api/crate?crate=2').then((r) => r.json()).catch(() => ({ items: [] })),
    meOnce(),
    fetch('api/crate?market=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ listings: [], sales: [] })),
  ]).then(([c1, c2, m, mk]) => {
    for (const it of [...(c1.items || []), ...(c2.items || [])]) items[it.id] = it;
    me = m.user; inventory = m.inventory || []; listings = mk.listings || []; sales = mk.sales || [];
    drawWallet(); drawListings(); drawDoubles(); drawSold();
  });
})();
