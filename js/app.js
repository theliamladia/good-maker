(() => {
  const $ = (id) => document.getElementById(id);
  const DEMO_SKIN = 'samples/spurdo.png';

  const state = {
    user: null,          // ImageData of the head source
    isDemo: true,
    outfit: window.OUTFITS[0],
    body: 'classic',     // 'classic' | 'slim'
    sleeve: 'short',     // 'short' | 'long'
    hair: 0,             // torso rows of the user's hair to keep (0 = off)
    hairGuess: 0,        // detected length, applied when the Slim body is chosen
    headwear: 'auto',    // 'keep' | 'auto' (remove hoods) | 'none' (no hat layer)
    erased: new Set(),   // "x,y" keys brushed away (hair on the jacket layer, hat pixels)
    hairKeys: new Set(), // hair pixels in the current render (erasable)
    merged: null,
    tone: [224, 172, 140],
    resultUrl: null,
  };
  const cache = {};

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // needed to read pixels from skin APIs
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = src;
  });

  const imageData = (img) => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
  };

  const loadData = async (src) => (cache[src] ||= imageData(await loadImage(src)));

  // Preview-only outfits arrive XOR-scrambled (see api/outfit.js) and are
  // decoded straight to pixels: no image URL, <img> or PNG file is created.
  const lockedCache = {};
  async function loadLocked(src) {
    if (lockedCache[src]) return lockedCache[src];
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(
        error === 'not_configured' ? 'PREVIEW NOT SET UP YET (MISSING ENV VARIABLE).'
          : error ? `PREVIEW UNAVAILABLE (${error.toUpperCase()}).`
          : `PREVIEW UNAVAILABLE (HTTP ${res.status}).`
      );
    }
    const { k, d } = await res.json();
    const key = Uint8Array.from(atob(k), (c) => c.charCodeAt(0));
    const bytes = Uint8Array.from(atob(d), (c, i) => c.charCodeAt(0) ^ key[i % key.length]);
    const bmp = await createImageBitmap(new Blob([bytes]));
    const data = imageData(bmp);
    bmp.close();
    return (lockedCache[src] = data);
  }
  // Texture set for the chosen sleeve (falls back to short if there's no long version).
  const setFor = (o) => (state.sleeve === 'long' && o.long ? o.long : o.bodies);
  const loadOutfit = (o, body) => (o.locked ? loadLocked(o.bodies[body]) : loadData(setFor(o)[body]));
  const EMPTY_OUTFIT = { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) };
  const bodiesOf = (o) => Object.keys(o.bodies);

  const toHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
  const fromHex = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  // ---------- 3D viewer ----------
  let viewer = null;
  const view = $('view3d');
  if (window.skinview3d) {
    viewer = new skinview3d.SkinViewer({
      canvas: document.createElement('canvas'),
      width: view.clientWidth, height: view.clientHeight,
    });
    viewer.autoRotate = false;
    viewer.autoRotateSpeed = 0.6;
    viewer.animation = new skinview3d.IdleAnimation();
    viewer.zoom = 0.85;
    view.appendChild(viewer.canvas);
    viewer.canvas.addEventListener('contextmenu', (e) => { if (state.outfit.locked) e.preventDefault(); });
    new ResizeObserver(() => viewer.setSize(view.clientWidth, view.clientHeight)).observe(view);

    $('rotate').onclick = (e) => {
      viewer.autoRotate = !viewer.autoRotate;
      e.currentTarget.setAttribute('aria-pressed', viewer.autoRotate);
    };
    const ANIMS = { idle: skinview3d.IdleAnimation, walk: skinview3d.WalkingAnimation, run: skinview3d.RunningAnimation };
    $('anim').onclick = (e) => {
      const btn = e.target.closest('[data-anim]');
      if (!btn) return;
      $('anim').querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', b === btn));
      const A = ANIMS[btn.dataset.anim];
      viewer.animation = A ? new A() : null;
    };
  } else {
    view.innerHTML = '<p class="micro mono center" style="padding-top:40%">3D PREVIEW UNAVAILABLE</p>';
  }

  // ---------- Outfits ----------
  const fullName = (o) => (o.color ? `${o.name} ${o.color}` : o.name);
  const label = (o) => `<span class="outfit-name">${o.name}</span>${o.color ? `<span class="outfit-color">${o.color}</span>` : ''}`;

  function drawOutfits() {
    const keep = $('outfits').scrollLeft; // don't jump the carousel on redraw
    $('outfits').innerHTML = '';
    for (const o of window.OUTFITS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'outfit';
      btn.setAttribute('aria-pressed', o === state.outfit);
      btn.innerHTML = o.locked
        ? `<div class="locked-thumb" aria-hidden="true"></div>${label(o)}`
        : `<img src="${setFor(o)[state.body] || setFor(o)[bodiesOf(o)[0]]}" alt="">${label(o)}`;
      btn.onclick = () => selectOutfit(o);
      $('outfits').appendChild(btn);
    }
    $('outfits').style.scrollBehavior = 'auto';
    $('outfits').scrollLeft = keep;
    $('outfits').style.scrollBehavior = '';
    updateCarouselButtons();
  }

  // Outfit carousel: two cards visible, side buttons page by one card.
  function updateCarouselButtons() {
    const el = $('outfits');
    $('outfitPrev').disabled = el.scrollLeft <= 2;
    $('outfitNext').disabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
  }
  const cardStep = () => {
    const card = $('outfits').querySelector('.outfit');
    return card ? card.getBoundingClientRect().width + 8 : $('outfits').clientWidth / 2;
  };
  $('outfitPrev').onclick = () => $('outfits').scrollBy({ left: -cardStep() });
  $('outfitNext').onclick = () => $('outfits').scrollBy({ left: cardStep() });
  $('outfits').addEventListener('scroll', updateCarouselButtons, { passive: true });
  window.addEventListener('resize', updateCarouselButtons);

  // ---------- Sleeve ----------
  function updateSleeveButtons() {
    const hasLong = !!state.outfit.long;
    $('sleeve').querySelectorAll('button').forEach((b) => {
      b.disabled = b.dataset.sleeve === 'long' && !hasLong;
      b.setAttribute('aria-checked', b.dataset.sleeve === (hasLong ? state.sleeve : 'short'));
    });
  }
  $('sleeve').onclick = (e) => {
    const btn = e.target.closest('[data-sleeve]');
    if (!btn || btn.disabled) return;
    state.sleeve = btn.dataset.sleeve;
    updateSleeveButtons();
    drawOutfits();
    render();
  };

  function selectOutfit(o) {
    state.outfit = o;
    updateSleeveButtons();
    $('outfitHint').hidden = !o.locked;
    $('outfitHint').textContent = o.locked ? 'PREVIEW ONLY / NOT AVAILABLE TO DOWNLOAD' : '';
    showNotice(o);
    setBody(state.body); // re-checks the body is available for this outfit
  }

  // Card next to the 3D preview for outfits with a notice (e.g. Founders).
  // Closing it hides it until a different outfit is picked and this one again.
  function showNotice(o) {
    const n = o.notice;
    $('dropCard').hidden = !n;
    if (!n) return;
    $('dropTag').textContent = n.tag;
    $('dropTitle').textContent = n.title;
    $('dropFree').innerHTML = `<span>${n.free}</span><span aria-hidden="true">${n.free}</span>`;
  }
  $('dropClose').onclick = () => { $('dropCard').hidden = true; };

  // ---------- Body ----------
  // Slim (female) bodies keep the user's hair by default; Classic starts without it.
  function setBody(body, why) {
    const available = bodiesOf(state.outfit);
    if (!available.includes(body)) {
      body = available[0];
      why = `${fullName(state.outfit)} COMES IN ${body.toUpperCase()} ONLY`;
    }
    $('body').querySelectorAll('button').forEach((b) => { b.disabled = !available.includes(b.dataset.body); });
    state.body = body;
    setHair(body === 'slim' ? state.hairGuess : 0, false);
    $('body').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.body === body));
    $('bodyHint').textContent = why || (body === 'slim' ? '3PX ARMS / ALEX MODEL' : '4PX ARMS / STEVE MODEL');
    drawOutfits();
    render();
  }
  $('body').onclick = (e) => {
    const btn = e.target.closest('[data-body]');
    if (btn) setBody(btn.dataset.body);
  };

  // ---------- Hair ----------
  function setHair(rows, rerender = true) {
    state.hair = rows;
    $('hair').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', +b.dataset.hair === rows));
    $('hairHint').textContent = rows
      ? 'KEEPS YOUR HAIR OVER THE OUTFIT'
      : state.hairGuess ? 'HAIR FOUND / TAP A LENGTH TO KEEP IT' : 'KEEPS YOUR HAIR OVER THE OUTFIT';
    updateEraseHint();
    if (rerender) render();
  }
  $('hair').onclick = (e) => {
    const btn = e.target.closest('[data-hair]');
    if (btn) setHair(+btn.dataset.hair);
  };

  // ---------- Headwear ----------
  const HEADWEAR_HINTS = {
    keep: 'KEEPS EVERYTHING ON YOUR HEAD LAYER',
    auto: 'REMOVES HOODS FROM YOUR OLD OUTFIT',
    none: 'REMOVES THE WHOLE HAT LAYER',
  };
  function setHeadwear(mode, rerender = true) {
    state.headwear = mode;
    $('headwear').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.headwear === mode));
    $('headwearHint').textContent = HEADWEAR_HINTS[mode];
    if (rerender) render();
  }
  $('headwear').onclick = (e) => {
    const btn = e.target.closest('[data-headwear]');
    if (btn) setHeadwear(btn.dataset.headwear);
  };

  // ---------- Upload ----------
  function useSkin(data, name, isDemo) {
    state.user = data;
    state.userName = name;
    state.isDemo = isDemo;
    resetErasers();
    $('uploadTitle').textContent = name;
    $('uploadSub').textContent = isDemo ? 'DEMO / TAP TO UPLOAD YOURS' : 'TAP TO SWAP SKIN';
    drawFace();
    setTone(SkinLib.sampleSkinTone(data), false);
    state.hairGuess = SkinLib.estimateHairRows(data, state.tone);
    const slim = SkinLib.detectSlim(data);
    setBody(slim ? 'slim' : 'classic', `DETECTED ${slim ? 'SLIM' : 'CLASSIC'} / TAP TO CHANGE`);
  }

  const showError = (msg) => {
    $('error').textContent = msg;
    $('error').hidden = !msg;
  };

  async function loadSkinFrom(src, name) {
    const data = imageData(await loadImage(src));
    if (data.width !== 64 || (data.height !== 64 && data.height !== 32)) {
      throw new Error(`SKIN MUST BE 64×64 OR 64×32 (GOT ${data.width}×${data.height}).`);
    }
    useSkin(data, name, false);
  }

  async function handleFile(file) {
    showError('');
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      await loadSkinFrom(url, file.name.replace(/\.png$/i, ''));
    } catch (e) {
      showError(e.message);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Username -> skin.
  // 1. Our own /api/skin (Vercel function): asks Mojang directly, so it's
  //    always current (renamed players too) and same-origin (readable pixels).
  // 2. If that endpoint isn't available (e.g. local dev), fall back to a UUID
  //    lookup via playerdb.co + crafatar, then name-based services.
  async function fetchOwnApi(name) {
    const res = await fetch(`api/skin?name=${encodeURIComponent(name)}`);
    const type = res.headers.get('content-type') || '';
    if (res.ok && type.startsWith('image/')) return URL.createObjectURL(await res.blob());
    if (type.includes('application/json')) {
      const { error } = await res.json().catch(() => ({}));
      if (error === 'not_found') throw Object.assign(new Error(`NO PLAYER NAMED ${name.toUpperCase()}.`), { final: true });
      if (error === 'no_skin') throw Object.assign(new Error(`${name.toUpperCase()} USES A DEFAULT SKIN.`), { final: true });
    }
    return null; // endpoint missing or upstream error -> use fallbacks
  }

  async function fallbackSources(name) {
    const n = encodeURIComponent(name);
    const sources = [];
    try {
      const res = await fetch(`https://playerdb.co/api/player/minecraft/${n}`);
      const id = res.ok && (await res.json())?.data?.player?.raw_id;
      if (id) sources.push(`https://crafatar.com/skins/${id}`, `https://mc-heads.net/skin/${id}`);
    } catch { /* lookup failed; use name-based sources */ }
    sources.push(`https://mc-heads.net/skin/${n}`, `https://minotar.net/skin/${n}`);
    return sources;
  }

  $('userForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = $('username').value.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) return showError('ENTER A VALID MINECRAFT USERNAME.');
    showError('');
    $('userForm').classList.add('loading');
    try {
      let own = null;
      try {
        own = await fetchOwnApi(name);
        if (own) return await loadSkinFrom(own, name);
      } catch (err) {
        if (err.final) return showError(err.message);
      } finally {
        if (own) URL.revokeObjectURL(own);
      }
      for (const src of await fallbackSources(name)) {
        try {
          await loadSkinFrom(src, name);
          return;
        } catch { /* try the next service */ }
      }
      showError(`COULDN'T FETCH ${name.toUpperCase()}'S SKIN. TRY UPLOADING IT.`);
    } finally {
      $('userForm').classList.remove('loading');
    }
  };

  $('file').onchange = (e) => handleFile(e.target.files[0]);
  // Whole page is a drop target.
  const drop = $('drop');
  document.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) drop.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    handleFile(e.dataTransfer.files[0]);
  });

  // ---------- Skin tone ----------
  // Every tone (auto, picker, eyedropper) goes through the same shading rules;
  // the ramp previews the highlight -> shadow shades that will be used.
  function setTone(rgb, rerender = true) {
    state.tone = rgb;
    const hex = toHex(rgb);
    $('tone').value = hex;
    $('swatch').style.background = hex;
    $('ramp').innerHTML = [1, 0, -1, -1.5, -2, -3]
      .map((s) => `<span style="background:${toHex(SkinLib.shadeTone(rgb, s))}"></span>`).join('');
    if (rerender) render();
  }
  $('tone').oninput = (e) => setTone(fromHex(e.target.value));
  $('auto').onclick = () => state.user && setTone(SkinLib.sampleSkinTone(state.user));

  function drawFace() {
    const ctx = $('face').getContext('2d');
    ctx.clearRect(0, 0, 8, 8);
    ctx.putImageData(state.user, -8, -8, 8, 8, 8, 8);
  }
  $('face').onclick = (e) => {
    if (!state.user) return;
    e.preventDefault(); // don't open the file picker
    const r = e.target.getBoundingClientRect();
    const x = 8 + Math.floor(((e.clientX - r.left) / r.width) * 8);
    const y = 8 + Math.floor(((e.clientY - r.top) / r.height) * 8);
    const i = (y * state.user.width + x) * 4;
    if (state.user.data[i + 3] > 0) setTone([...state.user.data.slice(i, i + 3)]);
  };

  // ---------- Render ----------
  let renderId = 0;
  async function render() {
    const id = ++renderId;
    const o = state.outfit;
    let outfit;
    try {
      outfit = await loadOutfit(o, state.body);
    } catch (err) {
      if (id !== renderId) return;
      $('outfitHint').hidden = false;
      $('outfitHint').textContent = err.message;
      return selectOutfit(window.OUTFITS[0]);
    }
    if (id !== renderId) return; // a newer render started
    const slim = state.body === 'slim';
    const args = [state.tone, slim, state.hair, state.erased, state.headwear];
    const merged = SkinLib.mergeSkin(state.user, outfit, ...args);
    // Eraser maps: for preview-only outfits, draw them without the outfit.
    state.merged = o.locked ? SkinLib.mergeSkin(state.user, EMPTY_OUTFIT, ...args) : merged;
    state.hairKeys = new Set(
      state.user ? SkinLib.extractHair(state.user, state.tone, state.hair).map((p) => p.x + ',' + p.y) : []
    );
    drawHairMap();

    const flat = $('flat');
    const texture = flat.closest('details');
    const dl = $('download');
    if (o.locked) {
      // Nothing downloadable: no texture view, no data URL, straight to 3D.
      flat.getContext('2d').clearRect(0, 0, 64, 64);
      texture.hidden = true;
      texture.open = false;
      state.resultUrl = null;
      dl.disabled = true;
      dl.firstChild.textContent = 'PREVIEW ONLY ';
      dl.title = `${fullName(o)} can be previewed but not downloaded`;
      if (viewer) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        c.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
        viewer.loadSkin(c, { model: slim ? 'slim' : 'default' });
      }
      return;
    }
    texture.hidden = false;
    flat.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
    state.resultUrl = flat.toDataURL('image/png');
    dl.disabled = state.isDemo;
    dl.firstChild.textContent = 'GOOD ME® ';
    dl.title = state.isDemo ? 'Upload your skin first' : '';
    if (viewer) viewer.loadSkin(state.resultUrl, { model: slim ? 'slim' : 'default' });
  }

  // ---------- Eraser ----------
  // Pixel maps of the torso (Hair card) and head (Head card) as seen on the
  // model: overlay layer drawn over base, one map pixel = one skin pixel.
  // TORSO erases carried-over hair so the outfit shows through; HEAD erases
  // hat-layer pixels (hoods, hats). Each map has its own undo/reset.
  const MAPS = {
    torso: {
      x: 16, y: 20, w: 24, h: 12, ox: 0, oy: 16,
      dividers: { h: [], v: [4, 12, 16] },
      hint: () => (state.hair ? 'DRAG OVER HAIR TO ERASE IT.' : 'TURN HAIR ON TO EDIT IT HERE.'),
      erasable: (key) => state.hairKeys.has(key),
    },
    head: {
      x: 0, y: 0, w: 32, h: 16, ox: 32, oy: 0,
      dividers: { h: [8], v: [8, 16, 24] },
      hint: () => 'DRAG OVER HOOD OR HAT PIXELS.',
      erasable: (key) => {
        const [x, y] = key.split(',').map(Number);
        return state.merged && state.merged.data[(y * 64 + x) * 4 + 3] > 0;
      },
    },
  };
  for (const [name, m] of Object.entries(MAPS)) {
    m.name = name;
    m.canvas = document.querySelector(`.pixmap[data-map="${name}"]`);
    m.hintEl = document.querySelector(`[data-hint="${name}"]`);
    m.undoBtn = document.querySelector(`[data-undo="${name}"]`);
    m.resetBtn = document.querySelector(`[data-reset="${name}"]`);
    m.keys = new Set(); // erased keys owned by this map
    m.strokes = [];     // undo stack
    m.hover = null;
  }

  function updateEraseHint() {
    for (const m of Object.values(MAPS)) m.hintEl.textContent = m.hint();
  }
  function updateEraserButtons() {
    for (const m of Object.values(MAPS)) {
      m.undoBtn.disabled = !m.strokes.length;
      m.resetBtn.disabled = !m.keys.size;
    }
  }
  function resetErasers() {
    state.erased.clear();
    for (const m of Object.values(MAPS)) { m.keys.clear(); m.strokes = []; }
    updateEraserButtons();
  }

  function drawMap(m) {
    const src = state.merged;
    const cv = m.canvas;
    const ctx = cv.getContext('2d');
    const scale = cv.width / m.w;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (!src) return;
    const px = (x, y) => src.data.slice((y * 64 + x) * 4, (y * 64 + x) * 4 + 4);
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const sx = m.x + x, sy = m.y + y;
        for (const c of [px(sx, sy), px(sx + m.ox, sy + m.oy)]) {
          if (!c[3]) continue;
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    ctx.fillStyle = 'rgba(11,21,38,0.35)';
    for (const x of m.dividers.v) ctx.fillRect(x * scale - 1, (m.dividers.h[0] || 0) * scale, 2, cv.height);
    for (const y of m.dividers.h) ctx.fillRect(0, y * scale - 1, cv.width, 2);
    if (m.hover) {
      ctx.strokeStyle = '#1a5cff';
      ctx.lineWidth = 2;
      ctx.strokeRect(m.hover[0] * scale + 1, m.hover[1] * scale + 1, scale - 2, scale - 2);
    }
  }
  const drawHairMap = () => Object.values(MAPS).forEach(drawMap);

  let stroke = null;
  let pending = false;
  function eraseAt(m, cell) {
    if (!cell) return;
    const key = `${m.x + cell[0] + m.ox},${m.y + cell[1] + m.oy}`;
    if (state.erased.has(key) || !m.erasable(key)) return;
    state.erased.add(key);
    m.keys.add(key);
    stroke.push(key);
    if (!pending) { // batch re-renders to one per frame while dragging
      pending = true;
      requestAnimationFrame(() => { pending = false; render(); });
    }
  }

  for (const m of Object.values(MAPS)) {
    const cv = m.canvas;
    const cellAt = (e) => {
      const r = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * m.w);
      const y = Math.floor(((e.clientY - r.top) / r.height) * m.h);
      return x >= 0 && y >= 0 && x < m.w && y < m.h ? [x, y] : null;
    };
    cv.onpointerdown = (e) => {
      cv.setPointerCapture(e.pointerId);
      stroke = [];
      eraseAt(m, cellAt(e));
    };
    cv.onpointermove = (e) => {
      m.hover = cellAt(e);
      if (stroke) eraseAt(m, m.hover);
      else drawMap(m);
    };
    cv.onpointerup = cv.onpointercancel = () => {
      if (stroke && stroke.length) m.strokes.push(stroke);
      stroke = null;
      updateEraserButtons();
    };
    cv.onpointerleave = () => { m.hover = null; drawMap(m); };

    m.undoBtn.onclick = () => {
      const last = m.strokes.pop();
      if (last) last.forEach((k) => { state.erased.delete(k); m.keys.delete(k); });
      updateEraserButtons();
      render();
    };
    m.resetBtn.onclick = () => {
      m.keys.forEach((k) => state.erased.delete(k));
      m.keys.clear();
      m.strokes = [];
      updateEraserButtons();
      render();
    };
  }

  // ---------- Hair / Head swiper ----------
  // Two cards side by side in a scroll-snap strip: swipe on touch, or use the
  // tabs. The active tab follows the scroll position.
  const slides = $('slides');
  const tabs = [...document.querySelectorAll('#swiper [data-slide]')];
  const dots = [...document.querySelectorAll('.swiper-dots span')];
  const showSlide = (i) => slides.scrollTo({ left: i * slides.clientWidth });
  tabs.forEach((t) => { t.onclick = () => showSlide(+t.dataset.slide); });
  slides.addEventListener('scroll', () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    tabs.forEach((t, j) => t.setAttribute('aria-selected', j === i));
    dots.forEach((d, j) => d.classList.toggle('on', j === i));
  }, { passive: true });

  $('download').onclick = () => {
    if (state.outfit.locked || !state.resultUrl) return;
    const a = document.createElement('a');
    a.href = state.resultUrl;
    a.download = `${(state.userName || 'skin').replace(/[^A-Za-z0-9_-]/g, '')}GOOD.png`;
    a.click();
  };

  // ---------- Boot with the demo head ----------
  updateSleeveButtons();
  setHeadwear('auto', false);
  updateEraseHint();
  updateEraserButtons();
  setBody('classic');
  loadData(DEMO_SKIN).then((d) => useSkin(d, 'Spurdo', true)).catch(() => render());
})();
