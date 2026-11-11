// Public GOOD® profile (/profiles/<slug>): the header (face, name, GOOD® COINS, member since,
// THE COLOR STORY®), then FITS, INVENTORY® (identical pieces stacked), ACHIEVEMENTS and COMMENTS.
// Everything sits on GOOD® BLUE between thin rules; no cards. Pieces are drawn to canvas only.
(() => {
  // One /api/me per page load, shared by every script that needs it.
  const meOnce = () => (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })));
  const $ = (id) => document.getElementById(id);
  const slug = (location.pathname.match(/\/profiles\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get('u') || '';
  // Each profile is its own page for search and sharing: point the canonical at it.
  if (slug) { const c = document.createElement('link'); c.rel = 'canonical'; c.href = `https://good.leems.me/profiles/${encodeURIComponent(slug.toLowerCase())}`; document.head.append(c); }
  const DEMO = 'samples/spurdo.png';
  const FITS_FIRST = 8, PIECES_FIRST = 12;
  const OWNERS_SET = 'GD-999';   // the owner's own set of every crate piece: shown, quietly named
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };
  let toastT;
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2400); };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  const key = encodeURIComponent(slug.toLowerCase());
  const post = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || r.status), { code: j.error });
    return j;
  };

  // SHOW ALL (N): a grid shows its first few children until opened.
  const more = (btn, grid, first, noun) => {
    const sync = () => {
      const n = grid.children.length;
      btn.hidden = n <= first;
      const open = grid.classList.contains('all');
      btn.textContent = open ? `SHOW FEWER ${noun}` : `SHOW ALL (${n})`;
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.onclick = () => { grid.classList.toggle('all'); sync(); if (!grid.classList.contains('all')) grid.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
    sync();
    return sync;
  };

  // Colour dots for a colourway name like "VIRIDIAN/COBALT VIOLET": one per colour we know.
  const COLORS = new Map((window.GOOD_COLORS || []).map((cl) => [cl.name, cl]));
  const colorOf = (n) => COLORS.get(String(n).replace(/[™ⓤ]/g, '').trim());
  const dots = (colorway) => {
    const d = el('span', 'pf-dots'); d.setAttribute('aria-hidden', 'true');
    for (const n of String(colorway || '').split('/')) {
      const cl = colorOf(n); if (!cl) continue;
      const h = Array.isArray(cl.hex) ? cl.hex : [cl.hex];
      const b = el('span', 'pf-dot');
      b.style.background = h.length > 1 ? `linear-gradient(to bottom, ${h[0]} 50%, ${h[1]} 50%)` : h[0];
      d.append(b);
    }
    return d.children.length ? d : null;
  };

  // INVENTORY®: identical pieces stack under one entry, newest pull first. The lowest serial
  // shows; the rest open on demand. Pieces are drawn flat to canvas (js/gooditems.js).
  const serialNo = (s) => (s === OWNERS_SET ? Infinity : (/(\d+)/.exec(s || '') || [0, Infinity])[1] * 1);
  const serialText = (s) => (s === OWNERS_SET ? `${s} · OWNER’S SET` : s);
  function inventory(list, items) {
    const stacks = new Map();
    for (const e of [...list].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))) {
      if (!stacks.has(e.item)) stacks.set(e.item, []);
      stacks.get(e.item).push(e.serial);
    }
    return [...stacks].map(([id, serials], i) => {
      serials.sort((a, b) => serialNo(a) - serialNo(b) || String(a).localeCompare(String(b)));
      const it = items[id] || { id, name: String(id).toUpperCase(), color: '' };
      const n = serials.length;
      const fig = el('figure', 'pf-piece');
      const spot = el('div', 'pf-spot');
      const cv = el('canvas', 'pf-piece-cv'); cv.setAttribute('aria-hidden', 'true');
      spot.append(cv);
      const cap = el('figcaption', 'pf-cap');
      const name = el('span', 'pf-cap-name', it.name);
      const cw = el('span', 'pf-cap-cw mono');
      const dd = dots(it.color); if (dd) cw.append(dd);
      cw.append(document.createTextNode(it.color || ''));
      const ser = el('span', 'pf-serial mono', serialText(serials[0]));
      cap.append(name, cw, ser);
      if (n > 1) {
        const list = el('span', 'pf-serials mono'); list.hidden = true; list.id = `serials-${i}`;
        for (const s of serials) list.append(el('span', null, serialText(s)));
        const b = el('button', 'pf-serial-btn mono', `×${n} · SERIALS`);
        b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', list.id);
        b.setAttribute('aria-label', `${n} copies: show every serial`);
        b.onclick = () => { list.hidden = !list.hidden; b.setAttribute('aria-expanded', String(!list.hidden)); b.textContent = list.hidden ? `×${n} · SERIALS` : `×${n} · HIDE`; ser.hidden = !list.hidden; };
        cap.append(b, list);
      }
      fig.setAttribute('aria-label', `${it.name} ${it.color}${n > 1 ? `, ${n} copies` : ''}, serial ${serials[0]}`);
      if (items[id]) GoodItems.draw(it, cv).catch(() => {});
      fig.append(spot, cap);
      return fig;
    });
  }

  Promise.all([
    fetch(`api/profile?name=${key}`).then((r) => (r.ok ? r.json() : null)),
    Promise.all(['api/crate', 'api/crate?crate=2', 'api/crate?crate=3', 'api/crate?crate=house'].map((u) => fetch(u).then((r) => r.json()).catch(() => ({ items: [] })))).then((cs) => ({ items: cs.flatMap((c) => c.items || []) })),   // every crate's pieces
    meOnce(),
    // The released drops' pieces (GUD™, WANDERING®) from the server, so fits with them draw.
    Promise.all(['gud=1', 'drop=wandering', 'drop=qg'].map((q) => fetch(`api/outfit?${q}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null))),
  ]).then(async ([p, c, m, drops]) => {
    if (window.GoodCompose) for (const cat of drops) if (cat) GoodCompose.addPrivate(cat);
    if (p && p.pieces && window.GoodCompose) GoodCompose.addPrivate(p.pieces);   // private pieces in these fits: to see, not to wear
    const viewer = m.user;
    const mine = !!viewer && viewer.profile === slug.toLowerCase();
    if (!p) { $('missing').hidden = false; document.title = 'NOT FOUND · GOOD®'; return; }
    $('found').hidden = false;
    document.title = `${p.name} · GOOD® PROFILE`;

    // Header
    $('name').textContent = p.name;
    const tags = [...(p.admin ? ['ADMIN'] : []), ...(p.tags || [])];
    $('tags').replaceChildren(...tags.map((t) => el('span', 'pf-tag mono', t)));
    $('tags').hidden = !tags.length;
    $('coins').textContent = p.coins;
    $('since').textContent = day(p.since) || '—';
    GoodHeads.draw($('head'), p.hasSkin ? `api/profile?name=${key}&skin=1` : null);
    $('share').onclick = async () => { try { await navigator.clipboard.writeText(location.href); toast('PROFILE LINK COPIED.'); } catch { toast(location.href); } };

    // Achievements
    $('aCount').textContent = `${p.achievements.length}`;
    GoodAch.draw($('ach'), p.achievements);   // js/ach-row.js (a profile lists earned ones only)

    // Inventory
    const items = Object.fromEntries((c.items || []).map((i) => [i.id, i]));
    $('iCount').textContent = `${p.inventory.length} ${p.inventory.length === 1 ? 'PIECE' : 'PIECES'}`;
    $('iEmpty').hidden = p.inventory.length > 0;
    $('inv').replaceChildren(...inventory(p.inventory, items));
    more($('iMore'), $('inv'), PIECES_FIRST, 'PIECES');

    // Home skin and fits (each fit drawn on their home skin)
    let skin;
    try { skin = p.hasSkin ? await GoodCompose.load(`api/profile?name=${key}&skin=1`) : await GoodCompose.load(DEMO); } catch { skin = await GoodCompose.load(DEMO); }
    // THE COLOR STORY®: every colour in their fits, one bar each, as wide as how often it's worn.
    const fits = new Map();
    const story = () => {
      const tally = new Map();
      for (const pcs of fits.values()) for (const piece of pcs) for (const n of (piece && piece.palette) || String((piece && piece.color) || '').split('/')) {
        const cl = colorOf(n); if (cl) tally.set(cl, (tally.get(cl) || 0) + 1);
      }
      const rows = [...tally].sort((x, y) => y[1] - x[1]);
      $('story').hidden = !rows.length;
      const total = rows.reduce((t, [, n]) => t + n, 0);
      const label = (cl) => (cl.mark ? `${cl.name}${cl.mark}` : cl.pantone || cl.name.includes('®') ? cl.name : `${cl.name}™`);
      $('storyStrip').replaceChildren(...rows.map(([cl, n]) => {
        const b = el('span', 'ac-story-bar'); const h = Array.isArray(cl.hex) ? cl.hex : [cl.hex];
        b.setAttribute('role', 'listitem'); b.style.setProperty('--n', n);
        b.style.background = h.length > 1 ? `linear-gradient(to bottom, ${h[0]} 50%, ${h[1]} 50%)` : h[0];
        const text = `${label(cl)} · ${Math.round((n / total) * 100)}%`;
        b.setAttribute('aria-label', text); b.title = text; b.onmouseenter = () => { $('storyRead').textContent = text; };
        return b;
      }));
      $('storyStrip').onmouseleave = () => { $('storyRead').innerHTML = '&nbsp;'; };
    };
    $('wCount').textContent = `${p.wardrobe.length}`;
    $('wEmpty').hidden = p.wardrobe.length > 0;
    let syncFits = () => {};
    $('grid').replaceChildren(...p.wardrobe.map((w) => {
      // Every fit opens in MAKER®: yours as saved; someone else's on your own skin (TRY THIS FIT).
      const fig = el('figure', 'pf-fit');
      const { ft, u, ...L } = w.look;
      const a = el('a', 'pf-fit-link');
      a.href = `./?${new URLSearchParams(mine && u ? { u, ...L } : L)}`;
      const box = el('span', 'pf-fit-fig gi-wait');
      const name = el('span', 'pf-fit-name', w.title || '');
      const pcs = el('span', 'pf-fit-pieces');
      const cw = el('span', 'pf-fit-cw mono');
      a.append(box, name, pcs, cw, el('span', 'pf-try mono', mine ? 'OPEN IN MAKER® →' : 'TRY THIS FIT →'));
      fig.append(a);
      if (mine) {
        // Your own profile: name your fits.
        const b = el('button', 'pf-rename mono', 'RENAME');
        b.type = 'button';
        b.onclick = async () => {
          const t = await GoodUI.ask({ title: 'NAME THIS FIT', label: 'UP TO 32 CHARACTERS. LEAVE IT EMPTY TO CLEAR THE NAME.', value: w.title || '', max: 32, allowEmpty: true });
          if (t === null) return;
          try { const j = await post('api/me', { action: 'title', id: w.id, title: t }); w.title = j.title; name.textContent = j.title; name.hidden = !j.title; toast(j.title ? 'FIT RENAMED.' : 'NAME CLEARED.'); } catch { toast('COULDN’T RENAME. TRY AGAIN.'); }
        };
        fig.append(b);
      }
      name.hidden = !w.title;
      GoodCompose.compose(skin, w.look).then(({ merged, slim, top, bottom }) => {
        box.classList.remove('gi-wait');
        box.append(GoodCompose.front(merged, slim));
        pcs.textContent = [top && top.name, bottom && bottom.name].filter(Boolean).join(' + ');
        cw.textContent = [top && top.color, bottom && bottom.color].filter(Boolean).join(' / ');
        fig.setAttribute('aria-label', `${w.title ? w.title + ': ' : ''}${pcs.textContent} in ${cw.textContent}`);
        fits.set(w, [top, bottom]); story();
      }).catch(() => { fig.remove(); syncFits(); });
      return fig;
    }));
    syncFits = more($('wMore'), $('grid'), FITS_FIRST, 'FITS');

    // Comments: any signed-in member can post; the profile's owner (or ADMIN) can delete.
    const drawWall = async () => {
      const w = await fetch(`api/wall?name=${key}`).then((r) => r.json()).catch(() => ({ comments: [] }));
      $('cCount').textContent = `${w.comments.length}`;
      $('comments').replaceChildren(...w.comments.map((cm) => {
        const li = document.createElement('li');
        li.innerHTML = '<div class="pf-c-who mono"><canvas aria-hidden="true"></canvas><a></a><span class="pf-c-at"></span></div><p class="pf-c-text"></p>';
        const who = li.querySelector('a'); who.textContent = cm.name; who.href = `profiles/${cm.slug}`;
        if (cm.admin) who.after(el('span', 'pf-tag mono', 'ADMIN'));
        li.querySelector('.pf-c-at').textContent = day(cm.at) || (cm.at || '').slice(0, 10);
        li.querySelector('.pf-c-text').textContent = cm.text;
        GoodHeads.draw(li.querySelector('canvas'), `api/profile?name=${encodeURIComponent(cm.slug)}&skin=1`);
        if (w.canDelete) {
          const d = el('button', 'pf-c-del mono', 'DELETE'); d.type = 'button';
          d.onclick = async () => { if (!(await GoodUI.confirm({ title: 'DELETE THIS COMMENT?', ok: 'DELETE', danger: true }))) return; try { await post('api/wall', { name: slug.toLowerCase(), action: 'delete', id: cm.id }); li.remove(); } catch { toast('COULDN’T DELETE.'); } };
          li.append(d);
        }
        return li;
      }));
    };
    $('cForm').hidden = !viewer; $('cSignin').hidden = !!viewer;
    $('cForm').onsubmit = async (e) => {
      e.preventDefault();
      const text = $('cText').value.trim();
      if (text.length < 2) return;
      try { await post('api/wall', { name: slug.toLowerCase(), text }); $('cText').value = ''; drawWall(); }
      catch (err) { toast(err.code === 'slow_down' ? 'SLOW DOWN. TRY AGAIN IN A MINUTE.' : 'COULDN’T POST. TRY AGAIN.'); }
    };
    drawWall();
  });
})();
