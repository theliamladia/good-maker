(() => {
  const $ = (id) => document.getElementById(id);
  const DEMO_SKIN = 'samples/spurdo.png';

  // Catalogue: each kind is a card; its colours are the actual variants.
  // A variant carries its kind's name and flags (locked, notice) plus its own
  // colour, files and swatch. kind.current = the colour last picked for it.
  function catalogue(kinds) {
    return kinds.map((k) => {
      const kind = { id: k.id, name: k.name };
      kind.colors = (k.colors || [k]).map((c) => ({
        locked: k.locked, notice: k.notice, ...c, name: k.name, kind,
      }));
      kind.current = kind.colors[0];
      return kind;
    });
  }
  const SHIRTS = catalogue(window.OUTFITS);
  const PANTS = catalogue(window.PANTS);
  const ALL_PANTS = PANTS.flatMap((k) => k.colors);

  const state = {
    user: null,          // ImageData of the head source
    isDemo: true,
    outfit: SHIRTS[0].current,
    body: 'classic',     // 'classic' | 'slim'
    sleeve: 'short',     // 'short' | 'long'
    pants: PANTS[0].current,
    pantsPicked: false,  // once the user picks pants, shirts stop changing them
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
        error === 'not_configured' ? 'ISN\'T AVAILABLE RIGHT NOW.'
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
  // Sleeve lengths an outfit comes in, and the one in effect for it (the
  // user's choice if available, otherwise whatever the outfit has).
  const sleevesOf = (o) => ['short', 'long'].filter((k) => (k === 'long' ? o.long : o.bodies));
  const sleeveFor = (o) => (sleevesOf(o).includes(state.sleeve) ? state.sleeve : sleevesOf(o)[0]);
  const setFor = (o) => (sleeveFor(o) === 'long' ? o.long : o.bodies);
  const loadOutfit = (o, body) => (o.locked ? loadLocked(setFor(o)[body]) : loadData(setFor(o)[body]));
  const EMPTY_OUTFIT = { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) };
  const bodiesOf = (o) => Object.keys(setFor(o));
  // Show only the options that exist; the grid shrinks to fit what's left.
  function showOnly(group, attr, available) {
    let n = 0;
    group.querySelectorAll('button').forEach((b) => {
      const ok = available.includes(b.dataset[attr]);
      b.hidden = !ok;
      if (ok) n++;
    });
    group.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  }

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
  // Top cards show the name only; the colourway is in the colour picker below.
  const nameOnly = (o) => `<span class="outfit-name">${o.name}</span>`;
  const label = (o) => `<span class="outfit-name">${o.name}</span>${o.color ? `<span class="outfit-color">${o.color}</span>` : ''}`;

  // Two-up carousel of cards with side buttons (used for shirts and pants).
  function carousel(listEl, prevBtn, nextBtn) {
    const update = () => {
      prevBtn.disabled = listEl.scrollLeft <= 2;
      nextBtn.disabled = listEl.scrollLeft + listEl.clientWidth >= listEl.scrollWidth - 2;
    };
    const step = () => {
      const card = listEl.querySelector('.outfit');
      return card ? card.getBoundingClientRect().width + 8 : listEl.clientWidth / 2;
    };
    prevBtn.onclick = () => listEl.scrollBy({ left: -step() });
    nextBtn.onclick = () => listEl.scrollBy({ left: step() });
    listEl.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Rebuild the cards without jumping the scroll position.
    return (cards) => {
      const keep = listEl.scrollLeft;
      listEl.replaceChildren(...cards);
      listEl.style.scrollBehavior = 'auto';
      listEl.scrollLeft = keep;
      listEl.style.scrollBehavior = '';
      update();
    };
  }
  const fillShirts = carousel($('outfits'), $('outfitPrev'), $('outfitNext'));
  const fillPants = carousel($('pants'), $('pantsPrev'), $('pantsNext'));

  function card(selected, inner, onPick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'outfit';
    btn.setAttribute('aria-pressed', selected);
    btn.innerHTML = inner;
    btn.onclick = onPick;
    return btn;
  }

  // Pants thumbnails: the fronts of both legs (pants layer over base), side by side.
  const pantsThumbs = {};
  async function pantsThumb(p) {
    if (pantsThumbs[p.id]) return pantsThumbs[p.id];
    const d = await loadData(p.src);
    const c = document.createElement('canvas');
    c.width = 8; c.height = 12;
    const ctx = c.getContext('2d');
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = 64;
    tmp.getContext('2d').putImageData(d, 0, 0);
    for (const [sx, sy, dx] of [[4, 20, 0], [4, 36, 0], [20, 52, 4], [4, 52, 4]]) ctx.drawImage(tmp, sx, sy, 4, 12, dx, 0, 4, 12);
    return (pantsThumbs[p.id] = c.toDataURL());
  }

  // Top thumbnails: a "ghost mannequin" front view, like the pants cards.
  // Torso front with both sleeve fronts either side (outer layer over base),
  // no skin or legs. Slim tops have 3px arms, so their mannequin is narrower.
  const shirtThumbs = {};
  async function shirtThumb(src, slim) {
    const key = src + (slim ? '|slim' : '');
    if (shirtThumbs[key]) return shirtThumbs[key];
    const d = SkinLib.combineOutfit(await loadData(src), null);
    const tex = document.createElement('canvas');
    tex.width = tex.height = 64;
    tex.getContext('2d').putImageData(new ImageData(d.data, 64, 64), 0, 0);
    const a = slim ? 3 : 4;
    const c = document.createElement('canvas');
    c.width = 8 + 2 * a; c.height = 12;
    const ctx = c.getContext('2d');
    // [source x, source y, width, destination x]: base first, then outer layer
    for (const [sx, sy, w, dx] of [
      [44, 20, a, 0], [44, 36, a, 0],         // right arm front (viewer's left)
      [20, 20, 8, a], [20, 36, 8, a],         // torso front
      [36, 52, a, a + 8], [52, 52, a, a + 8], // left arm front (viewer's right)
    ]) ctx.drawImage(tex, sx, sy, w, 12, dx, 0, w, 12);
    return (shirtThumbs[key] = c.toDataURL());
  }

  let drawId = 0;
  async function drawOutfits() {
    const id = ++drawId;
    // Cover art: a kind's GOOD® BLUE colourway if it has one, else its current colour.
    const cover = (k) => k.colors.find((c) => /^GOOD® BLUE/.test(c.color || '')) || k.current;
    const thumbs = await Promise.all(SHIRTS.map((k) => {
      const o = cover(k);
      if (o.locked || o.runway) return null;
      const body = setFor(o)[state.body] ? state.body : bodiesOf(o)[0];
      return shirtThumb(setFor(o)[body], body === 'slim');
    }));
    if (id !== drawId) return; // a newer redraw started
    fillShirts(SHIRTS.map((k, i) => { const o = k.current, c = cover(k); return card(
      o.kind === state.outfit.kind,
      c.runway
        ? `<div class="runway-thumb" aria-hidden="true"></div>${nameOnly(o)}`
        : c.locked
          ? `<div class="locked-thumb" aria-hidden="true"></div>${nameOnly(o)}`
          : `<img class="ghost-thumb" src="${thumbs[i]}" alt="">${nameOnly(o)}`,
      // RUNWAY® isn't a shirt: it opens the password prompt (js/runway.js).
      () => (o.runway ? window.GoodRunway && window.GoodRunway.open() : selectOutfit(o))
    ); }));
    drawColors($('shirtColors'), state.outfit, (c) => selectOutfit(c));
    drawPants();
  }

  async function drawPants() {
    $('pantsSection').hidden = false;
    const thumbs = await Promise.all(PANTS.map((k) => pantsThumb(k.current)));
    fillPants(PANTS.map(({ current: p }, i) => card(
      p.kind === state.pants.kind,
      `<img class="pants-thumb" src="${thumbs[i]}" alt="">${label(p)}`,
      () => pickPants(p)
    )));
    drawColors($('pantsColors'), state.pants, pickPants);
  }

  function pickPants(p) {
    state.fadeNext = true;
    p.kind.current = p;
    state.pants = p;
    state.pantsPicked = true;
    drawPants();
    render();
  }

  // Colour picker for the selected kind (hidden when it only comes in one).
  // Colours show as dots; the picked one moves to the front and expands into
  // a pill with its colourway name. Buttons are reused while the kind stays
  // the same, so the move (FLIP) and the expand can animate.
  function drawColors(el, selected, onPick) {
    const colors = selected.kind.colors;
    el.hidden = colors.length < 2;
    const sameKind = el._kind === selected.kind;
    el._kind = selected.kind;
    const before = new Map([...el.children].map((b) => [b._color, b.getBoundingClientRect()]));
    const buttons = new Map(sameKind ? [...el.children].map((b) => [b._color, b]) : []);

    const order = [selected, ...colors.filter((c) => c !== selected)];
    el.replaceChildren(...order.map((c) => {
      let b = buttons.get(c);
      if (!b) {
        b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch-btn';
        b._color = c;
        // Twin colourways get a dot split 50/50 between their two colours.
        const sw = Array.isArray(c.swatch)
          ? `linear-gradient(90deg, ${c.swatch[0]} 50%, ${c.swatch[1]} 50%)`
          : c.swatch || '#ccc';
        b.innerHTML = `<span class="dot" style="background:${sw}"></span><span class="sw-name">${c.color}</span>`;
        b.setAttribute('aria-label', c.color);
        b.title = c.color;
        b.onclick = () => onPick(c);
      }
      b.setAttribute('aria-pressed', c === selected);
      return b;
    }));

    // FLIP: slide each dot from where it was to where it is now.
    if (!sameKind || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const b of el.children) {
      const was = before.get(b._color);
      if (!was) continue;
      const now = b.getBoundingClientRect();
      const dx = was.left - now.left, dy = was.top - now.top;
      if (dx || dy) {
        b.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
    }
  }

  // ---------- Sleeve ----------
  function updateSleeveButtons() {
    const o = state.outfit;
    showOnly($('sleeve'), 'sleeve', sleevesOf(o));
    // Only one sleeve length? Nothing to choose, so hide the whole control.
    $('sleeveSection').hidden = sleevesOf(o).length < 2;
    $('sleeve').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.sleeve === sleeveFor(o)));
  }
  $('sleeve').onclick = (e) => {
    const btn = e.target.closest('[data-sleeve]');
    if (!btn) return;
    state.sleeve = btn.dataset.sleeve;
    updateSleeveButtons();
    setBody(state.body); // bodies can differ per sleeve; also redraws and renders
  };

  function selectOutfit(o) {
    state.fadeNext = true;
    o.kind.current = o;
    state.outfit = o;
    if (!state.pantsPicked) state.pants = ALL_PANTS.find((p) => p.id === o.pants) || PANTS[0].current;
    updateSleeveButtons();
    // (Preview-only is already shown on the download button; this line is for errors.)
    $('outfitHint').hidden = true;
    $('outfitHint').textContent = '';
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
    $('dropFree').hidden = !n.free;
    $('dropFree').innerHTML = n.free ? `<span>${n.free}</span><span aria-hidden="true">${n.free}</span>` : '';
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
    showOnly($('body'), 'body', available);
    state.body = body;
    setHair(body === 'slim' ? state.hairGuess : 0, false);
    $('body').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.body === body));
    $('bodyHint').textContent = why || `SAVES AS ${body === 'slim' ? 'SLIM / 3PX ARMS' : 'CLASSIC / 4PX ARMS'}`;
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
    setBody(slim ? 'slim' : 'classic', `DETECTED ${slim ? 'SLIM' : 'CLASSIC'} / YOU CAN SAVE AS ${slim ? 'CLASSIC' : 'SLIM'}`);
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

  // Username -> skin ImageData (throws with a user-facing message).
  async function skinForName(name) {
    let own = null;
    try {
      own = await fetchOwnApi(name);
      if (own) return checkSkin(imageData(await loadImage(own)));
    } catch (err) {
      if (err.final) throw err;
    } finally {
      if (own) URL.revokeObjectURL(own);
    }
    for (const src of await fallbackSources(name)) {
      try {
        return checkSkin(imageData(await loadImage(src)));
      } catch { /* try the next service */ }
    }
    throw new Error(`COULDN'T FETCH ${name.toUpperCase()}'S SKIN. TRY UPLOADING IT.`);
  }
  function checkSkin(data) {
    if (data.width !== 64 || (data.height !== 64 && data.height !== 32)) {
      throw new Error(`SKIN MUST BE 64×64 OR 64×32 (GOT ${data.width}×${data.height}).`);
    }
    return data;
  }

  $('userForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = $('username').value.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) return showError('ENTER A VALID MINECRAFT USERNAME.');
    showError('');
    $('userForm').classList.add('loading');
    try {
      useSkin(await skinForName(name), name, false);
    } catch (err) {
      showError(err.message);
    } finally {
      $('userForm').classList.remove('loading');
    }
  };

  // For js/runway.js: fetch a player's skin and read the current skin.
  window.GoodApp = {
    skinForName,
    current: () => ({ skin: state.user, name: state.userName, isDemo: state.isDemo }),
    // Pop-ups freeze the page behind them (CSS animations + the 3D render loop).
    setModalOpen(open) {
      document.body.classList.toggle('modal-open', open);
      if (viewer) viewer.renderPaused = open;
    },
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

  // ---------- 3D preview: crossfade between outfits/colours ----------
  // Picking another outfit or colour blends the old texture into the new one
  // over ~0.4s. Body changes (different arm model) and other edits switch
  // straight away.
  const fadeCanvas = document.createElement('canvas');
  fadeCanvas.width = fadeCanvas.height = 64;
  const fadeCtx = fadeCanvas.getContext('2d');
  let shown = null;     // { data, slim } currently on the model
  let fadeRaf = 0;
  function showSkin(data, slim) {
    if (!viewer) return;
    cancelAnimationFrame(fadeRaf);
    const from = shown;
    const to = { data: new Uint8ClampedArray(data), slim };
    shown = to;
    const model = { model: slim ? 'slim' : 'default' };
    const fade = state.fadeNext && from && from.slim === slim &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.fadeNext = false;
    if (!fade) {
      fadeCtx.putImageData(new ImageData(to.data, 64, 64), 0, 0);
      viewer.loadSkin(fadeCanvas, model);
      return;
    }
    const DURATION = 400;
    const mix = new Uint8ClampedArray(to.data.length);
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const k = t * t * (3 - 2 * t); // smoothstep
      for (let i = 0; i < mix.length; i++) mix[i] = from.data[i] + (to.data[i] - from.data[i]) * k;
      fadeCtx.putImageData(new ImageData(mix, 64, 64), 0, 0);
      viewer.loadSkin(fadeCanvas, model);
      if (t < 1) fadeRaf = requestAnimationFrame(step);
    };
    fadeRaf = requestAnimationFrame(step);
  }

  // ---------- Render ----------
  let renderId = 0;
  let lastGood = null; // last outfit colour that loaded and rendered
  async function render() {
    const id = ++renderId;
    const o = state.outfit;
    let outfit;
    try {
      outfit = await loadOutfit(o, state.body);
      outfit = SkinLib.combineOutfit(outfit, await loadData(state.pants.src));
    } catch (err) {
      if (id !== renderId) return;
      // Couldn't load this colour (e.g. a locked one that isn't set up yet).
      // Don't leave the card stuck on it: point the card back at a colour that
      // works and return to the last outfit that rendered, keeping the reason visible.
      const usable = o.kind.colors.find((c) => c !== o && !c.locked) || o.kind.colors.find((c) => c !== o);
      if (usable) o.kind.current = usable;
      const back = lastGood && lastGood !== o ? lastGood : usable || SHIRTS[0].current;
      selectOutfit(back);
      $('outfitHint').hidden = false;
      $('outfitHint').textContent = `${o.color || o.name} ${err.message}`;
      return;
    }
    if (id !== renderId) return; // a newer render started
    lastGood = o;
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
    // The PNG can't carry the arm model, so tell people what to pick in Minecraft.
    $('downloadHint').innerHTML = o.locked ? '' : `SAVES AS <strong>${slim ? 'SLIM' : 'CLASSIC'}</strong>. CHOOSE THE ${slim ? 'SLIM (ALEX)' : 'CLASSIC (STEVE)'} MODEL WHEN YOU UPLOAD IT TO MINECRAFT.`;
    if (o.locked) {
      // Nothing downloadable: no texture view, no data URL, straight to 3D.
      flat.getContext('2d').clearRect(0, 0, 64, 64);
      texture.hidden = true;
      texture.open = false;
      state.resultUrl = null;
      dl.disabled = true;
      dl.firstChild.textContent = 'PREVIEW ONLY ';
      dl.title = `${fullName(o)} can be previewed but not downloaded`;
      showSkin(merged.data, slim);
      return;
    }
    texture.hidden = false;
    flat.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
    state.resultUrl = flat.toDataURL('image/png');
    dl.disabled = state.isDemo;
    dl.firstChild.textContent = 'GOOD ME® ';
    dl.title = state.isDemo ? 'Upload your skin first' : '';
    showSkin(merged.data, slim);
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
  loadData(DEMO_SKIN).then((d) => useSkin(d, 'Chinny', true)).catch(() => render());
})();
