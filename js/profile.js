// Public GOOD® profile (/profiles/<slug>): achievements, serialized pulls and fits.
(() => {
  const $ = (id) => document.getElementById(id);
  const slug = (location.pathname.match(/\/profiles\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get('u') || '';
  const DEMO = 'samples/spurdo.png';
  let toastT;
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2400); };

  Promise.all([
    fetch(`api/profile?name=${encodeURIComponent(slug.toLowerCase())}`).then((r) => (r.ok ? r.json() : null)),
    fetch('api/crate').then((r) => r.json()).catch(() => ({ items: [] })),
  ]).then(async ([p, c]) => {
    if (!p) { $('missing').hidden = false; document.title = 'NOT FOUND · GOOD® DESIGN'; return; }
    $('found').hidden = false;
    document.title = `${p.name} · GOOD® PROFILE`;
    $('name').textContent = p.name;
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
    if (p.hasSkin) $('homeFig').append(GoodCompose.front({ data: skin.data }, SkinLib.detectSlim(skin)));
    else $('homeFig').closest('figure').hidden = true;
    $('wCount').textContent = `${p.wardrobe.length}`;
    $('wEmpty').hidden = p.wardrobe.length > 0;
    $('grid').replaceChildren(...p.wardrobe.map((w) => {
      const a = document.createElement('a');
      a.className = 'ac-card'; a.href = `./?${new URLSearchParams(w.look)}`; a.hidden = true;
      a.innerHTML = '<span class="ac-fig"></span><span class="ac-piece"></span><span class="ac-cw mono"></span>';
      GoodCompose.compose(skin, w.look).then(({ merged, slim, top, bottom }) => {
        a.querySelector('.ac-fig').append(GoodCompose.front(merged, slim));
        a.querySelector('.ac-piece').textContent = [top && top.name, bottom && bottom.name].filter(Boolean).join(' + ');
        a.querySelector('.ac-cw').textContent = [top && top.color, bottom && bottom.color].filter(Boolean).join(' / ');
        a.hidden = false;
      }).catch(() => a.remove());
      return a;
    }));
  });
})();
