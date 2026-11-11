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
    const row = (id) => (rows[id] ||= { id, asks: 0, floor: null, last: null, hist: [] });
    for (const l of listings) { const r = row(l.item); r.asks++; if (r.floor == null || l.price < r.floor) r.floor = l.price; }
    for (const s of sales) { const r = row(s.item); if (r.last == null) r.last = s.price; r.hist.unshift(s.price); }   // sales are newest first; hist runs oldest → newest
    return Object.values(rows);
  }

  // A sparkline of a piece's recent sale prices (oldest → newest): one thin white line, a dot on the last.
  function spark(hist) {
    const p = hist.slice(-12), W = 72, H = 18, pad = 2;
    if (p.length < 2) return '';   // one sale is no line: LAST SALE says it
    const lo = Math.min(...p), hi = Math.max(...p), span = hi - lo || 1;
    const xy = p.map((v, i) => [p.length < 2 ? W / 2 : pad + (i * (W - 2 * pad)) / (p.length - 1), hi === lo ? H / 2 : H - pad - ((v - lo) * (H - 2 * pad)) / span]);
    const [lx, ly] = xy[xy.length - 1];
    return `<svg class="mk-spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`
      + (p.length > 1 ? `<polyline points="${xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>` : '')
      + `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="1.8" fill="currentColor"/></svg>`;
  }

  // TRY IT ON: the MAKER® link that puts a piece on (index.html?top=&bottom=&acc=, read by lookFromUrl in js/app.js).
  // A crate item's unlock is a MAKER® colour id, a kind id (its first colour) or a set [top, bottom].
  // Anything missing is filled with the house default (and a top's own pairing), so nobody is shown half-dressed.
  // SAMPLE SALE (hse-*) pieces only reach MAKER® once owned, so they link only for their owner.
  const CAT = { top: window.OUTFITS || [], bottom: window.PANTS || [], acc: window.ACCESSORIES || [] };
  function findColour(id) {
    for (const [part, kinds] of Object.entries(CAT)) for (const k of kinds) {
      if (k.id === id && k.colors && k.colors[0]) return { part, c: k.colors[0] };
      const c = (k.colors || []).find((x) => x.id === id); if (c) return { part, c };
    }
    return null;
  }
  function tryHref(id) {
    const it = items[id];
    if (!it) return null;
    const L = {};
    if (String(id).startsWith('hse-')) {
      if (!inventory.some((e) => e.item === id)) return null;
      L[it.bottom ? 'bottom' : 'top'] = id;
    } else {
      for (const u of [].concat(it.unlock || [])) { const f = findColour(u); if (f && !L[f.part]) { L[f.part] = f.c.id; if (f.part === 'top' && f.c.pants) L.pair = f.c.pants; } }
      if (!L.top && !L.bottom && !L.acc) return null;
    }
    const house = CAT.top[0] && CAT.top[0].colors[0];
    const q = new URLSearchParams();
    q.set('top', L.top || (house ? house.id : 'shirt-cotton-maple-leaf'));
    q.set('bottom', L.bottom || L.pair || (house && house.pants) || 'cargo-maple-leaf-fatigue');
    if (L.acc) q.set('acc', L.acc);
    return `./?${q}`;
  }
  function tryLink(id, label) {
    const href = tryHref(id); if (!href) return null;
    const a = document.createElement('a'); a.className = 'mk-try mono'; a.href = href;
    a.textContent = label || 'TRY IT ON →';
    return a;
  }

  // Stats: only the figures there are (no wall of zeros). Nothing listed and nothing traded: no strip at all.
  function drawStats() {
    const day = sales.filter((s) => Date.now() - Date.parse(s.at) < DAY);
    const st = [];
    if (listings.length) st.push(['LISTED', listings.length], ['FLOOR', c(Math.min(...listings.map((l) => l.price)))]);
    if (sales[0]) st.push(['LAST TRADE', c(sales[0].price)]);
    if (day.length) st.push(['24H VOLUME', c(day.reduce((a, s) => a + s.price, 0))], ['24H TRADES', day.length]);
    $('stats').hidden = !st.length;
    $('stats').innerHTML = st.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    // The tape: trades from the last seven days, twice over so the loop is seamless. None: no tape.
    const week = sales.filter((s) => Date.now() - Date.parse(s.at) < 7 * DAY).slice(0, 16);
    const bits = week.map((s) => `<span><b></b> ${s.serial} ${c(s.price)} <em>${ago(s.at)}</em></span>`);
    const tape = $('tape');
    tape.parentElement.hidden = !bits.length;
    if (!bits.length) { tape.replaceChildren(); return; }
    tape.innerHTML = bits.join('') + bits.join('');
    tape.querySelectorAll('b').forEach((b, i) => { const s = week[i % bits.length]; b.textContent = nameOf(s.item); });
    tape.style.animationDuration = `${Math.max(20, bits.length * 6)}s`;
  }

  // Someone you traded with: their face and name, linking to their profile (DELETED stays plain).
  const slugify = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '');
  function person(name, slug) {
    const s = name && name !== 'DELETED' && name !== 'GOOD®' ? slug || slugify(name) : '';
    const el = document.createElement(s ? 'a' : 'span');
    el.className = 'mk-seller mono';
    if (s) el.href = `/profiles/${encodeURIComponent(s)}`;
    const av = document.createElement('canvas'); av.className = 'mk-av'; av.setAttribute('aria-hidden', 'true');
    el.append(av, name || '—');
    GoodHeads.draw(av, s ? `api/profile?name=${encodeURIComponent(s)}&skin=1` : null);
    return el;
  }

  // YOUR SALES: every piece of yours that sold, newest first, with who bought it.
  // Sales since your last visit also get a toast.
  function drawSales() {
    const sold = trades.filter((t) => t.type === 'sell');
    $('mySales').hidden = !me || !sold.length;
    if (!me || !sold.length) return;
    $('mySalesCount').textContent = `${sold.length} SOLD`;
    $('mySalesRows').replaceChildren(...sold.map((t) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="mk-s-when mono"></span><span class="mk-s-piece"></span><span class="mk-s-ser mono"></span><span class="mk-s-to mono">TO</span><span class="mk-s-price mono"></span>';
      li.querySelector('.mk-s-when').textContent = when(t.at);
      li.querySelector('.mk-s-piece').textContent = nameOf(t.item);
      li.querySelector('.mk-s-ser').textContent = t.serial;
      li.querySelector('.mk-s-to').after(person(t.with, t.withSlug));
      li.querySelector('.mk-s-price').innerHTML = `+${coin}${t.price}`;
      return li;
    }));
    const KEY = `good-sales-seen-${me.name}`;
    let seen = ''; try { seen = localStorage.getItem(KEY) || ''; } catch {}
    const fresh = sold.filter((t) => t.at > seen);
    if (seen && fresh.length) toast(fresh.length === 1 ? `SOLD: ${nameOf(fresh[0].item)} ${fresh[0].serial} TO ${fresh[0].with}.` : `${fresh.length} OF YOUR PIECES SOLD SINCE YOUR LAST VISIT. SEE YOUR SALES.`);
    try { localStorage.setItem(KEY, sold[0].at); } catch {}
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
      td[0].textContent = when(t.at); td[2].textContent = nameOf(t.item); td[3].textContent = t.serial;
      if (t.with) td[4].append(person(t.with, t.withSlug)); else td[4].textContent = '—';
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
    const stats = Object.fromEntries(book().map((r) => [r.id, r]));
    $('saleCount').textContent = listings.length ? `${listings.length} LISTED` : 'GOOD® · MARKET®';
    $('asks').querySelector('.mk-tools').hidden = !listings.length;
    // Empty: one calm line and the next step.
    $('empty').hidden = listings.length > 0;
    $('empty').innerHTML = me && inventory.some((e) => e.serial !== 'GD-999')
      ? 'Nothing listed yet. <a class="foot-link" href="#sell">List a piece of yours</a> and it’s the first thing people see.'
      : 'Nothing listed yet. Open a <a class="foot-link" href="inmotion">GOOD® CRATE</a>; anything you pull can be listed here.';
    if (listings.length && !rows.length) { $('empty').hidden = false; $('empty').textContent = 'Nothing matches that search.'; }
    $('listings').replaceChildren(...rows.map(({ id, ls, floor }) => {
      const f = piece(items[id], '');
      const cap = f.querySelector('figcaption');
      // Price signals: how many, from what; the last sale and a line of the recent ones.
      f.querySelector('.mk-meta').innerHTML = `<span>${ls.length} LISTED</span> · <span>FROM ${coin}${floor}</span>`;
      f.querySelector('.mk-meta').classList.add('mk-floor');
      const b = stats[id];
      if (b && b.hist.length) {
        const sig = document.createElement('span'); sig.className = 'mk-signal mono';
        sig.innerHTML = `<span>LAST SALE ${coin}${b.last}</span>${spark(b.hist)}`;
        sig.title = `Recent sales: ${b.hist.slice(-12).join(', ')} GOOD® COINS`;
        f.querySelector('.mk-meta').after(sig);
      }
      const tryOn = tryLink(id, own[id] ? 'WEAR YOURS →' : ''); if (tryOn) cap.append(tryOn);
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
      const hint = b ? [b.floor != null && `FLOOR ${c(b.floor)}`, b.last != null && `LAST ${c(b.last)}`].filter(Boolean).join(' · ') : '';
      if (hint) { const h = document.createElement('span'); h.className = 'mk-hint mono'; h.innerHTML = hint; f.querySelector('.mk-meta').after(h); }
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
    $('soldEmpty').hidden = sales.length > 0;
    $('sold').replaceChildren(...sales.slice(0, 20).map((s) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="mono"></td><td></td><td class="mono"></td><td class="num mono">${c(s.price)}</td>`;
      tr.children[0].textContent = ago(s.at); tr.children[1].textContent = nameOf(s.item); tr.children[2].textContent = s.serial;
      return tr;
    }));
  }

  // HOUSE®: four one-of-one pieces sold by GOOD® (api/_house.js). Buying one puts another in its
  // place, so the shelf is redrawn from what the server sends back.
  let house = [];
  function drawHouse() {
    const sec = $('house');
    sec.hidden = !house.length;
    $('houseGrid').replaceChildren(...house.map((it) => {
      const f = document.createElement('figure'); f.className = 'hs-piece';
      f.innerHTML = `<div class="hs-stage"><canvas${it.bottom ? ' class="hs-bottom"' : ''} aria-hidden="true"></canvas></div>
        <div class="hs-dots">${(it.hex || []).map((h) => `<i style="background:${h}"></i>`).join('')}</div>
        <p class="hs-name"></p><p class="hs-cw mono"></p>
        <div class="hs-foot mono"><b>${coin}${it.price}</b><span>1 OF 1</span></div>`;
      f.querySelector('.hs-name').textContent = it.name; f.querySelector('.hs-cw').textContent = it.color;
      window.GoodItems?.draw(it, f.querySelector('canvas')).catch(() => {});
      const b = document.createElement('button'); b.type = 'button'; b.className = 'hs-buy mono'; b.textContent = 'BUY';
      if (!me) { b.textContent = 'SIGN IN TO BUY'; b.onclick = () => { location.href = 'account'; }; }
      else {
        let sure = false, t;
        b.onclick = async () => {
          if (!sure) { sure = true; b.innerHTML = `ARE YOU SURE? ${coin}${it.price}`; b.classList.add('mk-sure'); t = setTimeout(() => { sure = false; b.textContent = 'BUY'; b.classList.remove('mk-sure'); }, 4000); return; }
          clearTimeout(t); b.disabled = true; b.textContent = 'BUYING…';
          try {
            const j = await post({ action: 'house', hid: it.id });
            me.coins = j.coins; items[j.item.id] = j.item; for (const x of j.shelf) items[x.id] = x; house = j.shelf;
            toast(`IT'S YOURS: ${it.name} ${it.color}, 1 OF 1. NOW IN MY INVENTORY® AND MAKER®.`); await refresh();
          } catch (e) { if (typeof e.coins === 'number') me.coins = e.coins; toast(ERR[e.code] || 'COULDN’T BUY IT. TRY AGAIN.'); await loadHouse(); }
        };
      }
      f.append(b);
      const tryOn = tryLink(it.id, 'WEAR IT IN MAKER® →'); if (tryOn) f.append(tryOn);
      return f;
    }));
  }
  async function loadHouse() {
    const h = await fetch('api/crate?crate=house', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ shelf: [], items: [] }));
    for (const it of h.items || []) items[it.id] = it;
    house = h.shelf || []; drawAll();
  }

  function drawAll() { drawWallet(); drawStats(); drawListings(); drawDoubles(); drawSales(); drawSold(); drawTrades(); drawHouse(); }
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
    fetch('api/crate?crate=3').then((r) => r.json()).catch(() => ({ items: [] })),
    meOnce(),
    fetch('api/crate?market=1', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ listings: [], sales: [] })),
  ]).then(([c1, c2, c3, m, mk]) => {
    for (const it of [...(c1.items || []), ...(c2.items || []), ...(c3.items || [])]) items[it.id] = it;
    take(m, mk); drawAll(); loadHouse();
  });
})();
