// Public GOOD® profile (/profiles/<slug>): achievements, serialized pulls and fits.
(() => {
  const $ = (id) => document.getElementById(id);
  const slug = (location.pathname.match(/\/profiles\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get('u') || '';
  const DEMO = 'samples/spurdo.png';
  let toastT;
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2400); };

  const key = encodeURIComponent(slug.toLowerCase());
  const post = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || r.status), { code: j.error });
    return j;
  };
  Promise.all([
    fetch(`api/profile?name=${key}`).then((r) => (r.ok ? r.json() : null)),
    fetch('api/crate').then((r) => r.json()).catch(() => ({ items: [] })),
    fetch('api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })),
  ]).then(async ([p, c, m]) => {
    const viewer = m.user;
    const mine = !!viewer && viewer.profile === slug.toLowerCase();
    if (!p) { $('missing').hidden = false; document.title = 'NOT FOUND · GOOD® DESIGN'; return; }
    $('found').hidden = false;
    document.title = `${p.name} · GOOD® PROFILE`;
    $('name').textContent = p.name;
    if (p.admin) { const b = document.createElement('span'); b.className = 'mb-admin mono'; b.textContent = 'ADMIN'; $('name').append(b); }
    $('coins').textContent = p.coins;
    GoodHeads.draw($('head'), p.hasSkin ? `api/profile?name=${key}&skin=1` : null);
    $('since').textContent = p.since ? `GOOD® MEMBER SINCE ${p.since}` : 'GOOD® MEMBER';
    $('share').onclick = async () => { try { await navigator.clipboard.writeText(location.href); toast('PROFILE LINK COPIED.'); } catch { toast(location.href); } };

    // Achievements
    $('aCount').textContent = `${p.achievements.length}`;
    $('ach').replaceChildren(...p.achievements.map((a) => {
      const el = document.createElement('div'); el.className = 'ac-ach-card';
      el.innerHTML = '<img alt="" draggable="false"><div><span class="ac-ach-n"></span><span class="ac-ach-d"></span><span class="ac-ach-p mono"></span></div>';
      el.querySelector('img').src = a.icon;
      el.querySelector('.ac-ach-n').textContent = a.name;
      el.querySelector('.ac-ach-d').textContent = a.desc;
      el.querySelector('.ac-ach-p').textContent = `${a.pct}% OF PLAYERS HAVE THIS${a.at ? ` · EARNED ${a.at.slice(0, 10)}` : ''}`;
      return el;
    }));

    // Inventory
    const items = Object.fromEntries((c.items || []).map((i) => [i.id, i]));
    $('iCount').textContent = `${p.inventory.length} ${p.inventory.length === 1 ? 'PIECE' : 'PIECES'}`;
    $('iEmpty').hidden = p.inventory.length > 0;
    $('inv').replaceChildren(...p.inventory.map((e) => {
      const it = items[e.item] || { id: e.item, name: e.item.toUpperCase(), color: '' };
      const el = document.createElement('div');
      el.className = `ac-card${it.tier === 'gold' || it.tier === 'ticket' ? ' ac-gold' : ''}`;
      el.innerHTML = '<canvas class="ac-inv-fig" aria-hidden="true"></canvas><span class="ac-piece"></span><span class="ac-cw mono"></span><span class="ac-serial mono"></span>';
      el.querySelector('.ac-piece').textContent = it.name;
      el.querySelector('.ac-cw').textContent = it.color;
      el.querySelector('.ac-serial').textContent = e.serial;
      if (items[e.item]) GoodItems.draw(it, el.querySelector('canvas')).catch(() => {});
      return el;
    }));

    // Home skin and wardrobe (each fit drawn on their home skin)
    let skin;
    try { skin = p.hasSkin ? await GoodCompose.load(`api/profile?name=${encodeURIComponent(slug.toLowerCase())}&skin=1`) : await GoodCompose.load(DEMO); } catch { skin = await GoodCompose.load(DEMO); }
    $('wCount').textContent = `${p.wardrobe.length}`;
    $('wEmpty').hidden = p.wardrobe.length > 0;
    $('grid').replaceChildren(...p.wardrobe.map((w) => {
      const a = document.createElement('a');
      a.className = 'ac-card'; a.href = `./?${new URLSearchParams(w.look)}`; a.hidden = true;
      a.innerHTML = '<span class="ac-fig"></span><span class="ac-fit-title"></span><span class="ac-piece"></span><span class="ac-cw mono"></span>';
      a.querySelector('.ac-fit-title').textContent = w.title || '';
      if (mine) {
        // Your own profile: name your fits.
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ac-rename mono'; b.textContent = 'RENAME';
        b.onclick = async (e) => {
          e.preventDefault(); e.stopPropagation();
          const t = prompt('Name this fit (up to 32 characters, empty to clear):', w.title || '');
          if (t === null) return;
          try { const j = await post('api/me', { action: 'title', id: w.id, title: t }); w.title = j.title; a.querySelector('.ac-fit-title').textContent = j.title; toast(j.title ? 'FIT RENAMED.' : 'NAME CLEARED.'); } catch { toast('COULDN’T RENAME. TRY AGAIN.'); }
        };
        a.append(b);
      }
      GoodCompose.compose(skin, w.look).then(({ merged, slim, top, bottom }) => {
        a.querySelector('.ac-fig').append(GoodCompose.front(merged, slim));
        a.querySelector('.ac-piece').textContent = [top && top.name, bottom && bottom.name].filter(Boolean).join(' + ');
        a.querySelector('.ac-cw').textContent = [top && top.color, bottom && bottom.color].filter(Boolean).join(' / ');
        a.hidden = false;
      }).catch(() => a.remove());
      return a;
    }));

    // Comments: any signed-in member can post; the profile's owner (or ADMIN) can delete.
    const drawWall = async () => {
      const w = await fetch(`api/wall?name=${key}`).then((r) => r.json()).catch(() => ({ comments: [] }));
      $('cCount').textContent = `${w.comments.length}`;
      $('comments').replaceChildren(...w.comments.map((cm) => {
        const li = document.createElement('li');
        li.innerHTML = '<div class="pf-c-who mono"><canvas aria-hidden="true"></canvas><a></a><span class="pf-c-at"></span></div><p class="pf-c-text"></p>';
        const who = li.querySelector('a'); who.textContent = cm.name; who.href = `profiles/${cm.slug}`;
        if (cm.admin) { const b = document.createElement('span'); b.className = 'mb-admin mono'; b.textContent = 'ADMIN'; who.after(b); }
        li.querySelector('.pf-c-at').textContent = (cm.at || '').slice(0, 10);
        li.querySelector('.pf-c-text').textContent = cm.text;
        GoodHeads.draw(li.querySelector('canvas'), `api/profile?name=${encodeURIComponent(cm.slug)}&skin=1`);
        if (w.canDelete) {
          const d = document.createElement('button'); d.type = 'button'; d.className = 'pf-c-del mono'; d.textContent = 'DELETE';
          d.onclick = async () => { if (!confirm('Delete this comment?')) return; try { await post('api/wall', { name: slug.toLowerCase(), action: 'delete', id: cm.id }); li.remove(); } catch { toast('COULDN’T DELETE.'); } };
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
