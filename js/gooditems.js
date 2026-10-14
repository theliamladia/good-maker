// GOOD® CRATE items, drawn flat (no body, no outfit): used by crate.html and
// the MY INVENTORY® section of account.html. Preview-only textures come
// scrambled from /api/outfit and are decoded straight to pixels; nothing here
// makes an image URL or a PNG. The GOLDEN TICKET is pixel art, drawn here.
window.GoodItems = (() => {
  const cache = {};
  const pixels = (bmp) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.drawImage(bmp, 0, 0); return x.getImageData(0, 0, 64, 64); };
  function locked(id) {
    return (cache[id] ||= (async () => {
      const r = await fetch(`api/outfit?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!r.ok) throw new Error('unavailable');
      const { k, d } = await r.json();
      const kb = Uint8Array.from(atob(k), (c) => c.charCodeAt(0));
      const bytes = Uint8Array.from(atob(d), (c, i) => c.charCodeAt(0) ^ kb[i % kb.length]);
      const bmp = await createImageBitmap(new Blob([bytes])); const img = pixels(bmp); bmp.close(); return img;
    })());
  }
  // SHIRT® files carry the jean's waistband on the torso's last rows: hem the tee instead.
  function hem(img) {
    const d = new Uint8ClampedArray(img.data), at = (x, y) => (y * 64 + x) * 4;
    for (const [y0, from] of [[30, 29], [31, 29], [45, 44], [46, 44], [47, 44]]) for (let x = 16; x < 40; x++) d.copyWithin(at(x, y0), at(x, from), at(x, from) + 4);
    return { width: 64, height: 64, data: d };
  }
  // Front view laid flat. Tops: torso with both sleeves (16×12). Bottoms: both legs (8×12).
  function flat(img, cv, bottom) {
    const src = document.createElement('canvas'); src.width = src.height = 64;
    src.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(img.data), 64, 64), 0, 0);
    const x = cv.getContext('2d');
    if (bottom) {
      cv.width = 8; cv.height = 12; x.imageSmoothingEnabled = false;
      for (const [sx, sy, dx] of [[4, 20, 0], [4, 36, 0], [20, 52, 4], [4, 52, 4]]) x.drawImage(src, sx, sy, 4, 12, dx, 0, 4, 12);
      return;
    }
    cv.width = 16; cv.height = 12; x.imageSmoothingEnabled = false;
    for (const [sx, sy, dx] of [[44, 20, 0], [44, 36, 0], [20, 20, 4], [20, 36, 4], [36, 52, 12], [52, 52, 12]]) x.drawImage(src, sx, sy, sx === 20 ? 8 : 4, 12, dx, 0, sx === 20 ? 8 : 4, 12);
  }
  // GOLDEN TICKET: a Minecraft-style item sprite, 16×16, dark outline, notched
  // ends, a perforated stub and the G stamped in.
  const TICKET = [
    '................',
    '................',
    '................',
    '.oooooooooooooo.',
    'oLLLLoLLLLLLLLLo',
    'oyyyypyyyggggyyo',
    '.oyyyyyyyg..yyo.',
    '..oyypyyyg.ggyo.',
    '..oyyyyyyg..gyo.',
    '.oyyypyyyggggyo.',
    'oyyyyyyyyyyyyyyo',
    'oddddpdddddddddo',
    '.oooooooooooooo.',
    '................',
    '................',
    '................',
  ];
  const TC = { o: '#5a3a00', L: '#fff3a8', y: '#ffd23f', d: '#c8901a', p: '#b07a10', g: '#9a6408' };
  function ticket(cv) {
    cv.width = cv.height = 16; const x = cv.getContext('2d'); x.clearRect(0, 0, 16, 16);
    TICKET.forEach((row, y) => [...row].forEach((ch, i) => { if (TC[ch]) { x.fillStyle = TC[ch]; x.fillRect(i, y, 1, 1); } }));
  }
  // Draw any crate item into a canvas. item = { id, tex, hem, bottom } (from /api/crate).
  async function draw(item, cv) {
    if (item.id === 'golden-ticket') { ticket(cv); return; }
    let img = await locked(item.tex);
    if (item.hem) img = hem(img);
    flat(img, cv, item.bottom);
  }
  // MY INVENTORY®: identical pieces stack into one card with the lowest serial on top.
  // A stack shows ×N; clicking it lists every serial in it, lowest first.
  const serialNo = (s) => { const m = /(\d+)/.exec(s || ''); return m ? +m[1] : Infinity; };
  function inventoryCards(inventory, items) {
    const stacks = new Map();   // first seen first: the inventory comes newest first
    for (const e of inventory) {
      if (!stacks.has(e.item)) stacks.set(e.item, []);
      stacks.get(e.item).push(e.serial);
    }
    return [...stacks].map(([id, serials]) => {
      serials.sort((a, b) => serialNo(a) - serialNo(b) || String(a).localeCompare(String(b)));
      const it = items[id] || { id, name: String(id).toUpperCase(), color: '' };
      const n = serials.length;
      const el = document.createElement('div');
      el.className = `ac-card${it.tier === 'gold' || it.tier === 'ticket' ? ' ac-gold' : ''}${n > 1 ? ' ac-stack' : ''}`;
      el.innerHTML = '<canvas class="ac-inv-fig" aria-hidden="true"></canvas><span class="ac-piece"></span><span class="ac-cw mono"></span><span class="ac-serial mono"></span>';
      el.querySelector('.ac-piece').textContent = it.name;
      el.querySelector('.ac-cw').textContent = it.color;
      el.querySelector('.ac-serial').textContent = serials[0];
      el.setAttribute('aria-label', n > 1 ? `${it.name} ${it.color}, ${n} copies, lowest serial ${serials[0]}` : `${it.name} ${it.color}, serial ${serials[0]}`);
      if (n > 1) {
        const badge = document.createElement('span'); badge.className = 'ac-count mono'; badge.textContent = `×${n}`;
        const list = document.createElement('div'); list.className = 'ac-serials mono'; list.hidden = true;
        for (const sr of serials) { const b = document.createElement('span'); b.textContent = sr; list.append(b); }
        el.append(badge, list);
        el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-expanded', 'false');
        const toggle = () => { list.hidden = !list.hidden; el.classList.toggle('open', !list.hidden); el.setAttribute('aria-expanded', String(!list.hidden)); };
        el.addEventListener('click', toggle);
        el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); } });
      }
      if (items[id]) draw(it, el.querySelector('canvas')).catch(() => {});
      return el;
    });
  }
  return { locked, hem, flat, ticket, draw, inventoryCards };
})();
