// COLORS®: the index (spectrum strip + chip grid) and the full-screen colour
// room. Colours come from js/colors.js, the list to update when one ships.
(() => {
  const $ = (id) => document.getElementById(id);
  const colors = window.GOOD_COLORS;
  // GOOD® colour names are ™; PANTONE® colours keep Pantone's name as is.
  const label = (c) => (c.pantone || c.name.includes('®') ? c.name : `${c.name}™`);
  const PANTONE_NOTE = 'PANTONE® is a registered trademark of Pantone LLC. Colour names and numbers used with attribution to Pantone.';
  const hexesOf = (c) => (Array.isArray(c.hex) ? c.hex : [c.hex]);
  const fillOf = (c) => { const h = hexesOf(c); return h.length > 1 ? `linear-gradient(90deg, ${h[0]} 50%, ${h[1]} 50%)` : h[0]; };
  const num = (i) => `Nº${String(i + 1).padStart(3, '0')}`;
  const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);
  // Text colour that reads on a colour (average of a twin).
  const lum = (h) => { const [r, g, b] = rgb(h).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const inkOn = (c) => { const h = hexesOf(c); const L = h.reduce((a, x) => a + lum(x), 0) / h.length; return L > 0.36 ? '#0b1526' : '#ffffff'; };
  // Hue order: chromatic colours round the wheel, then the neutrals light to dark.
  const hsl = (h) => {
    const [r, g, b] = rgb(h); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(hue * 60 + 360) % 360, s, l];
  };
  const hueKey = (c) => { const [h, s, l] = hsl(hexesOf(c)[0]); return s < 0.14 || l > 0.93 || l < 0.1 ? 1000 + (1 - l) : ((h + 340) % 360) + (1 - l) * 0.5; };

  $('cxCount').textContent = `${colors.length} COLORS`;

  // Spectrum strip
  const strip = $('cxStrip');
  colors.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cx-band'; b.setAttribute('role', 'listitem');
    b.style.background = fillOf(c);
    b.setAttribute('aria-label', `${label(c)}, open`);
    b.onmouseenter = b.onfocus = () => { $('cxRead').textContent = `${num(i)}  ${label(c)}`; };
    b.onclick = () => open(i, b);
    strip.append(b);
  });
  strip.onmouseleave = () => { $('cxRead').innerHTML = '&nbsp;'; };

  // Chip grid
  const grid = $('cxGrid');
  const chips = colors.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cx-chip';
    b.setAttribute('aria-label', `${label(c)}, open`);
    b.innerHTML = `<span class="cx-sw" style="background:${fillOf(c)}"></span>
      <span class="cx-meta"><span class="cx-n mono">${num(i)}</span><span class="cx-cn">${label(c)}</span><span class="cx-ch mono">${hexesOf(c).map((h) => h.toUpperCase()).join(' / ')}</span>${c.pantone ? '<span class="cx-pt mono">PANTONE®</span>' : ''}</span>`;
    b.onclick = () => open(i, b.firstElementChild);
    return b;
  });
  let order = colors.map((_, i) => i);
  function lay(kind) {
    order = colors.map((_, i) => i);
    if (kind === 'hue') order.sort((a, b) => hueKey(colors[a]) - hueKey(colors[b]));
    const first = new Map(chips.map((el) => [el, el.getBoundingClientRect()]));
    grid.replaceChildren(...order.map((i) => chips[i]));
    // Glide each chip from its old place to its new one.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) chips.forEach((el) => {
      const a = first.get(el), b = el.getBoundingClientRect();
      if (!a.width) return;
      el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
    });
    [...strip.children].forEach((el) => el.style.order = order.indexOf([...strip.children].indexOf(el)));
  }
  lay('released');
  document.querySelectorAll('.cx-order button').forEach((b) => b.onclick = () => {
    document.querySelectorAll('.cx-order button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    lay(b.dataset.order);
  });

  // The room
  const room = $('cxRoom');
  const mini = $('cxMini');
  colors.forEach((c, i) => {
    const s = document.createElement('span');
    s.style.background = fillOf(c);
    mini.append(s);
  });
  let at = 0, opener = null;
  function paint(i, dir) {
    at = i;
    const c = colors[at], ink = inkOn(c);
    room.style.setProperty('--ink-on', ink);
    $('cxFill').style.background = fillOf(c);
    $('cxNum').textContent = `${num(at)} / ${colors.length}`;
    $('cxName').textContent = label(c);
    fitName();
    $('cxHex').textContent = hexesOf(c).map((h) => h.toUpperCase()).join(' / ');
    $('cxDesc').textContent = c.desc || 'DESCRIPTION COMING SOON.';
    $('cxWhere').textContent = c.where.toUpperCase();
    $('cxThanks').hidden = $('cxPantone').hidden = !c.pantone;
    $('cxPantone').textContent = c.pantone ? `${c.pantone}. ${PANTONE_NOTE}` : '';
    [...mini.children].forEach((s, k) => { s.classList.toggle('on', k === at); s.style.order = order.indexOf(k); });
    if (dir) $('cxIn').querySelector('.cx-room-body').animate(
      [{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
  }
  // The name runs as big as it can without breaking a word.
  function fitName() {
    const el = $('cxName');
    el.style.fontSize = '';
    let size = parseFloat(getComputedStyle(el).fontSize);
    const words = () => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
    el.style.whiteSpace = 'nowrap';
    const longest = Math.max(...el.textContent.split(' ').map((w) => { el.textContent = w; return words(); }));
    el.textContent = label(colors[at]);
    el.style.whiteSpace = '';
    if (longest > el.clientWidth) el.style.fontSize = `${Math.floor(size * el.clientWidth / longest)}px`;
  }
  addEventListener('resize', () => { if (!room.hidden) fitName(); });
  function open(i, from) {
    opener = from;
    paint(i, 0);
    room.hidden = false;
    document.body.style.overflow = 'hidden';
    fitName();
    // Flood out from the chip that was clicked.
    const r = from.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      $('cxFill').animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }], { duration: 650, easing: 'cubic-bezier(0.6, 0, 0.2, 1)' });
      $('cxIn').animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
    }
    $('cxClose').focus({ focusVisible: false });
  }
  function close() {
    const done = () => { room.hidden = true; document.body.style.overflow = ''; (opener?.closest('button') || opener)?.focus(); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
    room.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in' }).onfinish = done;
  }
  // Prev / next follow the order on screen.
  const step = (d) => { const k = order.indexOf(at); paint(order[(k + d + order.length) % order.length], d); };
  $('cxPrev').onclick = () => step(-1);
  $('cxNext').onclick = () => step(1);
  $('cxClose').onclick = close;
  mini.onclick = (e) => { const k = [...mini.children].indexOf(e.target); if (k >= 0 && k !== at) paint(k, order.indexOf(k) > order.indexOf(at) ? 1 : -1); };
  mini.removeAttribute('aria-hidden');
  document.addEventListener('keydown', (e) => {
    if (room.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  let x0 = null;
  room.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  room.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
})();
