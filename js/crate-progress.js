// GOOD® CRATE collection: "X% COLLECTED" under the open button, and SEE ALL: every piece in this
// crate, the ones you own in colour, the ones you're missing greyed out. Owned = any serialized
// copy in your inventory. The crate comes from the script tag: <script data-crate="1|2|3">.
// The open scripts call GoodProgress.refresh() after each pull.
(() => {
  const tag = document.currentScript, crate = (tag && tag.dataset.crate) || '1';
  const anchor = document.getElementById('wallet');
  if (!anchor) return;
  const css = document.createElement('style');
  css.textContent = `
.gp { margin: 18px auto 0; text-align: center; color: inherit; }
.gp-line { border: 0; background: none; color: inherit; cursor: pointer; font: inherit; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; padding: 8px 4px; }
.gp-line b { font-weight: 700; }
.gp-line u { text-underline-offset: 5px; }
.gp-bar { display: block; width: min(320px, 80vw); height: 3px; margin: 6px auto 0; background: color-mix(in srgb, currentColor 22%, transparent); }
.gp-bar i { display: block; height: 100%; background: currentColor; }
.gp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 14px; max-width: 900px; margin: 22px auto 0; text-align: center; }
.gp-grid[hidden] { display: none; }
.gp-card { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 0.62rem; letter-spacing: 0.12em; line-height: 1.3; text-transform: uppercase; }
.gp-card canvas { width: 88px; height: 88px; image-rendering: pixelated; }
.gp-card small { opacity: .7; font-size: 0.56rem; }
.gp-miss canvas { filter: grayscale(1); opacity: .28; }
.gp-miss span, .gp-miss small { opacity: .45; }
.gp-card em { font-style: normal; font-size: 0.56rem; opacity: .8; }`;
  document.head.append(css);

  const box = document.createElement('div'); box.className = 'gp mono'; box.hidden = true;
  box.innerHTML = '<button type="button" class="gp-line" aria-expanded="false"></button><span class="gp-bar" aria-hidden="true"><i></i></span><div class="gp-grid" hidden></div>';
  anchor.after(box);
  const line = box.querySelector('.gp-line'), bar = box.querySelector('.gp-bar i'), grid = box.querySelector('.gp-grid');
  line.onclick = () => { grid.hidden = !grid.hidden; line.setAttribute('aria-expanded', String(!grid.hidden)); draw(); };

  let items = [], owned = new Map(), drawn = false;
  const url = crate === '1' ? '/api/crate' : `/api/crate?crate=${crate}`;
  const crateOnce = fetch(url).then((r) => r.json()).then((c) => (c.items || []).filter((it) => it.tier !== 'ticket')).catch(() => []);

  function draw() {
    const n = items.filter((it) => owned.has(it.id)).length, N = items.length;
    const p = N ? Math.floor((n / N) * 100) : 0;
    line.innerHTML = `<b>${p}% COLLECTED</b> · ${n} OF ${N} · <u>${grid.hidden ? 'SEE ALL' : 'HIDE'}</u>`;
    bar.style.width = `${p}%`;
    if (grid.hidden) return;
    if (!drawn) {
      grid.replaceChildren(...items.map((it) => {
        const c = document.createElement('div'); c.dataset.id = it.id;
        c.innerHTML = '<canvas aria-hidden="true"></canvas><span></span><small></small><em></em>';
        c.querySelector('span').textContent = it.name; c.querySelector('small').textContent = it.color || '';
        if (window.GoodItems) GoodItems.draw(it, c.querySelector('canvas')).catch(() => {});
        return c;
      }));
      drawn = true;
    }
    for (const c of grid.children) {
      const k = owned.get(c.dataset.id) || 0;
      c.className = `gp-card${k ? '' : ' gp-miss'}`;
      c.querySelector('em').textContent = k ? (k > 1 ? `OWNED ×${k}` : 'OWNED') : 'MISSING';
    }
  }

  async function refresh() {
    const [list, me] = await Promise.all([crateOnce, fetch('/api/me', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))]);
    if (!me || !me.user || !list.length) { box.hidden = true; return; }
    items = list;
    owned = new Map();
    for (const e of me.inventory || []) if (e && e.item) owned.set(e.item, (owned.get(e.item) || 0) + 1);
    box.hidden = false;
    draw();
  }
  window.GoodProgress = { refresh };
  refresh();
})();
