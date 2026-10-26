// MARKET® (/market): spare serialized copies listed for GOOD® COINS. The server does every
// check and moves the coins and the copy (POST /api/crate { action: 'list' | 'unlist' | 'buy' });
// this page shows the tape, the stats, the asks,
// your pieces, and MY TRADES (your own history), and asks ARE YOU SURE? before a purchase.
(() => {
  const $ = (id) => document.getElementById(id);
  const coin = '<span class="coin" aria-hidden="true"></span>';
  const meOnce = () => (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })));
  let me = null, inventory = [], items = {}, listings = [], sales = [], trades = [];

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
  const ERR = { coins: 'NOT ENOUGH GOOD® COINS.', gone: 'SOMEONE GOT THERE FIRST.', busy: 'ONE MOMENT. TRY AGAIN.', price: 'PRICE: 1 TO 9999 GOOD® COINS.', too_many: 'TWENTY LISTINGS AT A TIME.', own_listing: 'THAT ONE IS YOURS.', not_tradable: 'THE GD-999 SET STAYS WITH YOU.', slow_down: 'SLOW DOWN A LITTLE.', signed_out: 'SIGN IN FIRST.' };

  const DAY = 864e5;
  const nameOf = (id) => { const it = items[id]; return it ? `${it.name} ${it.color}` : id; };
  const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 6e4));
    if (m < 1) return 'NOW'; if (m < 60) return `${m}M AGO`; if (m < 1440) return `${Math.round(m / 60)}H AGO`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };
  const when = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).toUpperCase();
  const c = (n) => (n == null ? '—' : `${coin}${n}`);

  // Per piece: asks, floor (lowest ask), last sale (the FLOOR/LAST hint when you sell).
  function book() {
    const rows = {};
    const row = (id) => (rows[id] ||= { id, asks: 0, floor: null, last: null });
    for (const l of listings) { const r = row(l.item); r.asks++; if (r.floor == null || l.price < r.floor) r.floor = l.price; }
    for (const s of sales) { const r = row(s.item); if (r.last == null) r.last = s.price; }   // newest first
    return Object.values(rows);
  }

  function drawStats() {
    const day = sales.filter((s) => Date.now() - Date.parse(s.at) < DAY);
    $('stListed').textContent = listings.length;
    $('stFloor').innerHTML = listings.length ? c(Math.min(...listings.map((l) => l.price))) : '—';
    $('stLast').innerHTML = sales[0] ? c(sales[0].price) : '—';
    $('stVol').innerHTML = c(day.reduce((a, s) => a + s.price, 0));
    $('stTrades').textContent = day.length;
    // The tape: the latest trades, twice over so the loop is seamless.
    const bits = sales.slice(0, 16).map((s) => `<span><b></b> ${s.serial} ${c(s.price)} <em>${ago(s.at)}</em></span>`);
    const tape = $('tape');
    if (!bits.length) { tape.innerHTML = '<span>NO TRADES YET · LIST A PIECE AND BE THE FIRST</span>'; tape.classList.add('mk-still'); return; }
    tape.classList.remove('mk-still');
    tape.innerHTML = bits.join('') + bits.join('');
    tape.querySelectorAll('b').forEach((b, i) => { const s = sales[i % bits.length]; b.textContent = nameOf(s.item); });
    tape.style.animationDuration = `${Math.max(20, bits.length * 6)}s`;
  }

  function drawTrades() {
    const tab = document.querySelector('#tradeTabs [aria-selected="true"]').dataset.t;
    const bought = trades.filter((t) => t.type === 'buy'), sold = trades.filter((t) => t.type === 'sell');
    const spent = bought.reduce((a, t) => a + t.price, 0), earned = sold.reduce((a, t) => a + t.price, 0), net = earned - spent;
    $('tradeSum').innerHTML = `<div><dt>BOUGHT</dt><dd>${bought.length} · ${c(spent)}</dd></div><div><dt>SOLD</dt><dd>${sold.length} · ${c(earned)}</dd></div>`
      + `<div><dt>NET</dt><dd>${net > 0 ? '+' : net < 0 ? '−' : ''}${coin}${Math.abs(net)}</dd></div><div><dt>LISTED NOW</dt><dd>${listings.filter((l) => l.mine).length}</dd></div>`;
    const rows = trades.filter((t) => tab === 'all' || t.type === tab || (tab === 'list' && t.type === 'unlist'));
    const TYPE = { buy: 'BOUGHT', sell: 'SOLD', list: 'LISTED', unlist: 'UNLISTED' };
    $('tradeEmpty').hidden = rows.length > 0;
    $('tradeRows').replaceChildren(...rows.map((t) => {
      const tr = document.createElement('tr');
      tr.className = `mk-t-${t.type}`;
      const amt = t.type === 'buy' ? `−${coin}${t.price}` : t.type === 'sell' ? `+${coin}${t.price}` : `<span class="mk-dim">${coin}${t.price}</span>`;
      tr.innerHTML = `<td class="mono"></td><td class="mono"><span class="mk-type">${TYPE[t.type] || ''}</span></td><td></td><td class="mono"></td><td class="mono"></td><td class="num mono">${amt}</td>`;
      const td = tr.children;
      td[0].textContent = when(t.at); td[2].textContent = nameOf(t.item); td[3].textContent = t.serial; td[4].textContent = t.with || '—';
      return tr;
    }));
  }

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
    $('tradesBtn').hidden = !me;
    window.GoodNav?.update(me);
  }

  // FOR SALE: one card per piece (grouped copies), headed by its name, the floor and how many
  // are listed; BUY takes the cheapest copy that isn't yours; ALL COPIES opens each one.
  function buyButton(l, label = 'BUY') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mk-btn mono';
    if (l.mine) {
      b.textContent = 'UNLIST';
      b.onclick = async () => { b.disabled = true; try { await post({ action: 'unlist', lid: l.lid }); toast('BACK IN YOUR INVENTORY.'); await refresh(); } catch (e) { toast(ERR[e.code] || 'COULDN’T UNLIST. TRY AGAIN.'); b.disabled = false; } };
    } else if (!me) {
      b.textContent = 'SIGN IN TO BUY'; b.onclick = () => { location.href = 'account'; };
    } else {
      b.textContent = label;
      let sure = false, t;
      b.onclick = async () => {
        if (!sure) { sure = true; b.innerHTML = `ARE YOU SURE? ${coin}${l.price}`; b.classList.add('mk-sure'); t = setTimeout(() => { sure = false; b.textContent = label; b.classList.remove('mk-sure'); }, 4000); return; }
        clearTimeout(t); b.disabled = true; b.textContent = 'BUYING…';
        try { const j = await post({ action: 'buy', lid: l.lid }); me.coins = j.coins; toast(`IT'S YOURS: ${l.serial}. NOW IN MY INVENTORY® AND MAKER®.`); await refresh(); }
        catch (e) { if (typeof e.coins === 'number') me.coins = e.coins; toast(ERR[e.code] || 'COULDN’T BUY IT. TRY AGAIN.'); await refresh(); }
      };
    }
    return b;
  }
  function seller(l) {
    const who = document.createElement(l.sellerSlug ? 'a' : 'span');
    who.className = 'mk-seller mono';
    if (l.sellerSlug) who.href = `/profiles/${encodeURIComponent(l.sellerSlug)}`;
    const av = document.createElement('canvas'); av.className = 'mk-av'; av.setAttribute('aria-hidden', 'true');
    who.append(av, l.seller || 'GOOD®');
    GoodHeads.draw(av, l.sellerSkin && l.sellerSlug ? `api/profile?name=${encodeURIComponent(l.sellerSlug)}&skin=1` : null);
    return who;
  }
  function drawListings() {
    const q = $('q').value.trim().toLowerCase();
    const sort = $('sort').value;
    const own = {};
    for (const e of inventory) own[e.item] = (own[e.item] || 0) + 1;
    const groups = {};
    for (const l of listings) {
      const it = items[l.item] || {};
      if (q && !`${it.name} ${it.color} ${l.seller} ${l.serial}`.toLowerCase().includes(q)) continue;
      (groups[l.item] ||= []).push(l);
    }
    const rows = Object.entries(groups).map(([id, ls]) => ({ id, ls: ls.sort((a, b) => a.price - b.price), floor: Math.min(...ls.map((l) => l.price)), at: ls.reduce((m, l) => (l.at > m ? l.at : m), '') }))
      .sort((a, b) => (sort === 'new' ? b.at.localeCompare(a.at) : sort === 'high' ? b.floor - a.floor : a.floor - b.floor));
    $('saleCount').textContent = `${listings.length} LISTED`;
    $('empty').hidden = listings.length > 0;
    $('listings').replaceChildren(...rows.map(({ id, ls, floor }) => {
      const f = piece(items[id], `${ls.length} LISTED`);
      const cap = f.querySelector('figcaption');
      const head = document.createElement('span'); head.className = 'mk-floor mono'; head.innerHTML = `FROM ${coin}${floor}`;
      f.querySelector('.mk-cw').after(head);
      if (own[id]) {
        const o = document.createElement('a'); o.className = 'mk-own mono'; o.href = './';
        o.textContent = `YOU OWN ×${own[id]} · WEAR IT IN MAKER® →`; cap.append(o);
      }
      const best = ls.find((l) => !l.mine);
      const row = document.createElement('div'); row.className = 'mk-row';
      row.append(best ? buyButton(best, ls.length > 1 ? 'BUY THE CHEAPEST' : 'BUY') : buyButton(ls[0]));
      cap.append(row);
      // Every copy: serial, seller, price, its own BUY / UNLIST
      const more = document.createElement('details'); more.className = 'mk-copies';
      more.innerHTML = `<summary class="mono">${ls.length > 1 ? `ALL ${ls.length} COPIES` : 'THIS COPY'}</summary><ol></ol>`;
      more.querySelector('ol').replaceChildren(...ls.map((l) => {
        const li = document.createElement('li');
        const ser = document.createElement('span'); ser.className = 'mk-ser mono'; ser.textContent = l.serial;
        const pr = document.createElement('span'); pr.className = 'mk-price mono'; pr.innerHTML = `${coin}${l.price}`;
        li.append(ser, seller(l), pr, buyButton(l));
        return li;
      }));
      cap.append(more);
      return f;
    }));
  }

  // Your pieces: every serialized copy from every GOOD® CRATE can be listed (not the owner's GD-999 set).
  function drawDoubles() {
    if (!me) { $('sellNote').innerHTML = '<a class="foot-link" href="account">Sign in</a> to list your pieces.'; $('doubles').replaceChildren(); return; }
    const count = {}, stats = Object.fromEntries(book().map((r) => [r.id, r]));
    for (const e of inventory) count[e.item] = (count[e.item] || 0) + 1;
    const spare = inventory.filter((e) => e.serial !== 'GD-999').sort((a, b) => a.item.localeCompare(b.item) || (+a.serial.slice(3) || 0) - (+b.serial.slice(3) || 0));
    if (!spare.length) { $('doubles').replaceChildren(Object.assign(document.createElement('p'), { className: 'mk-empty', textContent: 'Nothing to sell yet. Every piece you pull from a GOOD® CRATE shows up here.' })); return; }
    $('doubles').replaceChildren(...spare.map((e) => {
      const f = piece(items[e.item], count[e.item] < 2 ? `${e.serial} · YOUR ONLY COPY` : e.serial);
      const b = stats[e.item];
      if (b) { const h = document.createElement('span'); h.className = 'mk-hint mono'; h.innerHTML = `FLOOR ${c(b.floor)} · LAST ${c(b.last)}`; f.querySelector('.mk-meta').after(h); }
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
    $('soldEmpty').hidden = sales.length > 0;
    $('sold').replaceChildren(...sales.slice(0, 20).map((s) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="mono"></td><td></td><td class="mono"></td><td class="num mono">${c(s.price)}</td>`;
      tr.children[0].textContent = ago(s.at); tr.children[1].textContent = nameOf(s.item); tr.children[2].textContent = s.serial;
      return tr;
    }));
  }

  function drawAll() { drawWallet(); drawStats(); drawListings(); drawDoubles(); drawSold(); drawTrades(); }
  const take = (m, mk) => { me = m.user; inventory = m.inventory || []; listings = mk.listings || []; sales = mk.sales || []; trades = mk.trades || []; };

  async function refresh() {
    const [m, mk] = await Promise.all([
      fetch('/api/me', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })),
      fetch('api/crate?market=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ listings: [], sales: [] })),
    ]);
    take(m, mk); drawAll();
  }

  $('q').addEventListener('input', drawListings);
  $('sort').addEventListener('change', drawListings);
  // MY TRADES: a window over the page.
  const dlg = $('trades');
  $('tradesBtn').onclick = () => { drawTrades(); dlg.showModal(); };
  $('tradesClose').onclick = () => dlg.close();
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('tradeTabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]'); if (!t) return;
    $('tradeTabs').querySelectorAll('[data-t]').forEach((b) => b.setAttribute('aria-selected', String(b === t)));
    drawTrades();
  });
  Promise.all([
    fetch('api/crate').then((r) => r.json()).catch(() => ({ items: [] })),
    fetch('api/crate?crate=2').then((r) => r.json()).catch(() => ({ items: [] })),
    meOnce(),
    fetch('api/crate?market=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ listings: [], sales: [] })),
  ]).then(([c1, c2, m, mk]) => {
    for (const it of [...(c1.items || []), ...(c2.items || [])]) items[it.id] = it;
    take(m, mk); drawAll();
  });
})();
