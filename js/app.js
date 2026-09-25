(() => {
  const $ = (id) => document.getElementById(id);
  const DEMO_SKIN = 'samples/spurdo.png';

  const state = {
    user: null,          // ImageData of the head source
    isDemo: true,
    outfit: window.OUTFITS[0],
    body: 'classic',     // 'classic' | 'slim'
    hair: 0,             // torso rows of the user's hair to keep (0 = off)
    hairGuess: 0,        // detected length, applied when the Slim body is chosen
    headwear: 'auto',    // 'keep' | 'auto' (remove hoods) | 'none' (no hat layer)
    erased: new Set(),   // hair pixels ("x,y" on the jacket layer) the user brushed away
    strokes: [],         // undo stack: arrays of keys erased per stroke
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
  const loadOutfit = (o, body) => (o.locked ? loadLocked(o.bodies[body]) : loadData(o.bodies[body]));
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
    viewer.autoRotate = true;
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
  function drawOutfits() {
    $('outfits').innerHTML = '';
    for (const o of window.OUTFITS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'outfit';
      btn.setAttribute('aria-pressed', o === state.outfit);
      btn.innerHTML = o.locked
        ? `<div class="locked-thumb">★<small>PREVIEW ONLY</small></div><span>${o.name}</span>`
        : `<img src="${o.bodies[state.body] || o.bodies[bodiesOf(o)[0]]}" alt=""><span>${o.name}</span>`;
      btn.onclick = () => selectOutfit(o);
      $('outfits').appendChild(btn);
    }
  }

  function selectOutfit(o) {
    state.outfit = o;
    $('outfitHint').hidden = !o.locked;
    $('outfitHint').textContent = o.locked ? 'PREVIEW ONLY / NOT AVAILABLE TO DOWNLOAD' : '';
    setBody(state.body); // re-checks the body is available for this outfit
  }

  // ---------- Body ----------
  // Slim (female) bodies keep the user's hair by default; Classic starts without it.
  function setBody(body, why) {
    const available = bodiesOf(state.outfit);
    if (!available.includes(body)) {
      body = available[0];
      why = `${state.outfit.name} COMES IN ${body.toUpperCase()} ONLY`;
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
    state.erased = new Set();
    state.strokes = [];
    updateEraserButtons();
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
      dl.title = `${o.name} can be previewed but not downloaded`;
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
  // Pixel maps of the head and torso as seen on the model (overlay layer drawn
  // over base). One map pixel = one skin pixel. HEAD erases hat-layer pixels
  // (hoods, hats); TORSO erases carried-over hair so the outfit shows through.
  const MAPS = {
    head: {
      x: 0, y: 0, w: 32, h: 16, ox: 32, oy: 0,
      dividers: { h: [8], v: [8, 16, 24] },
      labels: ['R', 'FRONT', 'L', 'BACK'], cols: '1fr 1fr 1fr 1fr',
      hint: 'CLICK OR DRAG TO REMOVE HOOD OR HAT PIXELS.',
      erasable: (key) => {
        const [x, y] = key.split(',').map(Number);
        return state.merged && state.merged.data[(y * 64 + x) * 4 + 3] > 0;
      },
    },
    torso: {
      x: 16, y: 20, w: 24, h: 12, ox: 0, oy: 16,
      dividers: { h: [], v: [4, 12, 16] },
      labels: ['R', 'FRONT', 'L', 'BACK'], cols: '4fr 8fr 4fr 8fr',
      hint: 'CLICK OR DRAG OVER HAIR TO SHOW THE OUTFIT UNDERNEATH.',
      erasable: (key) => state.hairKeys.has(key),
    },
  };
  let map = MAPS.head;
  const hairMap = $('hairMap');
  let hover = null;

  function setMap(name) {
    map = MAPS[name];
    $('eraseTabs').querySelectorAll('[data-map]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.map === name));
    $('mapLabels').style.gridTemplateColumns = map.cols;
    $('mapLabels').innerHTML = map.labels.map((l) => `<span>${l}</span>`).join('');
    updateEraseHint();
    drawHairMap();
  }
  function updateEraseHint() {
    $('eraseHint').textContent = map === MAPS.torso && !state.hair ? 'TURN HAIR ON TO EDIT IT HERE.' : map.hint;
  }
  $('eraseTabs').onclick = (e) => {
    const btn = e.target.closest('[data-map]');
    if (btn) setMap(btn.dataset.map);
  };

  function drawHairMap() {
    const m = state.merged;
    const ctx = hairMap.getContext('2d');
    const scale = hairMap.width / map.w;
    ctx.clearRect(0, 0, hairMap.width, hairMap.height);
    if (!m) return;
    const px = (x, y) => m.data.slice((y * 64 + x) * 4, (y * 64 + x) * 4 + 4);
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const sx = map.x + x, sy = map.y + y;
        for (const c of [px(sx, sy), px(sx + map.ox, sy + map.oy)]) {
          if (!c[3]) continue;
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    ctx.fillStyle = 'rgba(11,21,38,0.35)';
    for (const x of map.dividers.v) ctx.fillRect(x * scale - 1, (map.dividers.h[0] || 0) * scale, 2, hairMap.height);
    for (const y of map.dividers.h) ctx.fillRect(0, y * scale - 1, hairMap.width, 2);
    if (hover) {
      ctx.strokeStyle = '#1a5cff';
      ctx.lineWidth = 2;
      ctx.strokeRect(hover[0] * scale + 1, hover[1] * scale + 1, scale - 2, scale - 2);
    }
  }

  const cellAt = (e) => {
    const r = hairMap.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * map.w);
    const y = Math.floor(((e.clientY - r.top) / r.height) * map.h);
    return x >= 0 && y >= 0 && x < map.w && y < map.h ? [x, y] : null;
  };

  let stroke = null;
  let pending = false;
  function eraseAt(cell) {
    if (!cell) return;
    const key = `${map.x + cell[0] + map.ox},${map.y + cell[1] + map.oy}`;
    if (state.erased.has(key) || !map.erasable(key)) return;
    state.erased.add(key);
    stroke.push(key);
    if (!pending) { // batch re-renders to one per frame while dragging
      pending = true;
      requestAnimationFrame(() => { pending = false; render(); });
    }
  }
  function updateEraserButtons() {
    $('eraseUndo').disabled = !state.strokes.length;
    $('eraseReset').disabled = !state.erased.size;
  }

  hairMap.onpointerdown = (e) => {
    hairMap.setPointerCapture(e.pointerId);
    stroke = [];
    eraseAt(cellAt(e));
  };
  hairMap.onpointermove = (e) => {
    hover = cellAt(e);
    if (stroke) eraseAt(hover);
    else drawHairMap();
  };
  hairMap.onpointerup = hairMap.onpointercancel = () => {
    if (stroke && stroke.length) state.strokes.push(stroke);
    stroke = null;
    updateEraserButtons();
  };
  hairMap.onpointerleave = () => { hover = null; drawHairMap(); };

  $('eraseUndo').onclick = () => {
    const last = state.strokes.pop();
    if (last) last.forEach((k) => state.erased.delete(k));
    updateEraserButtons();
    render();
  };
  $('eraseReset').onclick = () => {
    state.erased.clear();
    state.strokes = [];
    updateEraserButtons();
    render();
  };

  $('download').onclick = () => {
    if (state.outfit.locked || !state.resultUrl) return;
    const a = document.createElement('a');
    a.href = state.resultUrl;
    a.download = `${(state.userName || 'skin').replace(/[^A-Za-z0-9_-]/g, '')}GOOD.png`;
    a.click();
  };

  // ---------- Boot with the demo head ----------
  setHeadwear('auto', false);
  setMap('head');
  setBody('classic');
  loadData(DEMO_SKIN).then((d) => useSkin(d, 'Spurdo', true)).catch(() => render());
})();
