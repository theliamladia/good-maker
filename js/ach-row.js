// ACHIEVEMENTS as a row of icons, five a page, earned first. Hover, focus or tap an icon for
// its full card. Used by the account page and public profiles.
window.GoodAch = (() => {
  const PER = 5;
  function card(a) {
    const el = document.createElement('div');
    el.className = `ac-ach-card ac-ach-pop${a.earned === false ? ' locked' : ''}`;
    el.setAttribute('role', 'tooltip');
    el.innerHTML = '<img alt="" draggable="false"><div><span class="ac-ach-n"></span><span class="ac-ach-d"></span><span class="ac-ach-p mono"></span></div>';
    el.querySelector('img').src = a.icon;
    el.querySelector('.ac-ach-n').textContent = a.name;
    el.querySelector('.ac-ach-d').textContent = a.desc;
    const when = a.earned !== false ? (a.at ? `EARNED ${a.at.slice(0, 10)}` : 'EARNED') : a.gone ? "YOU CAN'T GET THIS ANYMORE" : "YOU DON'T HAVE THIS YET";
    el.querySelector('.ac-ach-p').innerHTML = `<span>${a.pct}% OF PLAYERS HAVE THIS</span><span>${when}</span>`;
    return el;
  }
  // list: [{ name, desc, icon, pct, at, earned? }]; earned: false marks a locked one.
  function draw(host, list) {
    const sorted = [...list].sort((a, b) => (b.earned !== false) - (a.earned !== false) || String(b.at || '').localeCompare(String(a.at || '')));
    const pages = Math.max(1, Math.ceil(sorted.length / PER));
    let page = 0;
    const row = document.createElement('div'); row.className = 'ac-ach-row';
    const pager = document.createElement('div'); pager.className = 'ac-ach-pager mono';
    pager.innerHTML = '<button type="button" aria-label="Previous achievements">‹</button><span></span><button type="button" aria-label="More achievements">›</button>';
    const [prev, next] = pager.querySelectorAll('button');
    const show = () => {
      row.replaceChildren(...sorted.slice(page * PER, page * PER + PER).map((a, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = `ac-ach-icon${a.earned === false ? ' locked' : ''}${i >= 3 ? ' right' : ''}`;
        b.setAttribute('aria-label', `${a.name}: ${a.desc}${a.earned === false ? (a.gone ? " You can't get this anymore." : " You don't have this yet.") : ''}`);
        const img = document.createElement('img'); img.src = a.icon; img.alt = ''; img.draggable = false;
        b.append(img, card(a));
        b.onclick = () => { const was = b.classList.contains('open'); row.querySelectorAll('.open').forEach((o) => o.classList.remove('open')); b.classList.toggle('open', !was); };
        return b;
      }));
      pager.querySelector('span').textContent = `${page + 1} / ${pages}`;
      prev.disabled = page === 0; next.disabled = page === pages - 1;
    };
    prev.onclick = () => { page = Math.max(0, page - 1); show(); };
    next.onclick = () => { page = Math.min(pages - 1, page + 1); show(); };
    pager.hidden = pages < 2;
    const wrap = document.createElement('div'); wrap.className = 'ac-ach-wrap'; wrap.append(row, pager);
    host.classList.remove('ac-ach-grid');   // (the old card grid)
    host.replaceChildren(wrap);
    show();
  }
  document.addEventListener('click', (e) => { if (!e.target.closest('.ac-ach-icon')) document.querySelectorAll('.ac-ach-icon.open').forEach((o) => o.classList.remove('open')); });
  return { draw };
})();
