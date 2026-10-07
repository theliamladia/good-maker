(() => {
  const $ = (id) => document.getElementById(id);
  const DEMO_SKIN = 'samples/spurdo.png';

  // Catalogue: each kind is a card; its colours are the actual variants.
  // A variant carries its kind's name and flags (locked, hat, ...) plus its own
  // colour, files and swatch. kind.current = the colour last picked for it.
  function catalogue(kinds) {
    return kinds.map((k) => {
      const kind = { id: k.id, name: k.name, line: k.line || 'good' };
      kind.colors = (k.colors || [k]).map((c) => ({
        locked: k.locked, baseUnderHoles: k.baseUnderHoles, hat: k.hat, shoes: k.shoes, boxers: k.boxers, src: k.src, cropped: k.cropped, noTuck: k.noTuck, ...c, name: k.name, kind,
      }));
      kind.current = kind.colors[0];
      return kind;
    });
  }
  const SHIRTS = catalogue(window.OUTFITS);
  const PANTS = catalogue(window.PANTS);
  const ALL_PANTS = PANTS.flatMap((k) => k.colors);
  // GOOD® / BABY®: kinds shown under the current line ('both' shows under either).
  const inLine = (k) => k.line === 'both' || k.line === state.line;
  const lineShirts = () => SHIRTS.filter(inLine);

  const state = {
    user: null,          // ImageData of the head source
    isDemo: true,
    line: 'good',        // GOOD® / BABY® toggle: which kinds are shown
    outfit: SHIRTS[0].current,
    body: 'classic',     // 'classic' | 'slim'
    sleeve: 'short',     // 'short' | 'long'
    pants: PANTS[0].current,
    pantsPicked: false,  // once the user picks pants, shirts stop changing them
    noTop: false,        // the top was taken off (equipped squares by the model)
    noBottom: false,     // the bottom (pants) was taken off
    noShoes: false,      // the shoes were taken off (bare feet)
    shoe: 'black',       // pants with shoes: key of their shoes files
    boxer: 'blue',       // pants with boxers: 'blue' (POOLSIDE™, as drawn) | 'tartan' (HIGHLAND™)
    tucked: true,        // shirt tucked in (pants waistband shows) or hanging over it
    hair: 0,             // torso rows of the user's hair to keep (0 = off)
    hairGuess: 0,        // detected length, applied when the Slim body is chosen
    headwear: 'keep',    // 'keep' | 'auto' (remove hoods) | 'none' (no hat layer)
    erased: new Set(),   // "x,y" keys brushed away (hair on the jacket layer, hat pixels)
    hairKeys: new Set(), // hair pixels in the current render (erasable)
    merged: null,
    tone: [224, 172, 140],
    keepSkin: false,     // MY SKIN: bare skin keeps the player's own texture, not the tone
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
  const sleeveFor = (o, sleeve = state.sleeve) => (sleevesOf(o).includes(sleeve) ? sleeve : sleevesOf(o)[0]);
  const setFor = (o, sleeve = state.sleeve) => (sleeveFor(o, sleeve) === 'long' ? o.long : o.bodies);
  const loadOutfit = async (o, body, sleeve = state.sleeve) => {
    const src = setFor(o, sleeve)[body];
    const d = await (o.locked ? loadLocked(src) : loadData(src));
    return o.baseUnderHoles ? (cache[`${src}|holes`] ||= SkinLib.baseUnderHoles(d)) : d;
  };
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
    // The cloud POSTUP leans on: drops in from above the screen, and floats
    // slowly back up and away when another animation is picked.
    let cloudUp = false, cloudAnim = null;
    function leanCloud(show) {
      const el = $('leanCloud');
      if (show === cloudUp) return;
      cloudUp = show;
      const off = `translateX(-50%) translateY(${-(el.getBoundingClientRect().bottom + 60)}px)`;
      const rest = 'translateX(-50%)';
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (cloudAnim) cloudAnim.cancel();
      el.style.visibility = 'visible';
      cloudAnim = el.animate(
        show
          ? [{ transform: off, opacity: 0.7 }, { transform: 'translateX(-50%) translateY(14px)', opacity: 1, offset: 0.78 }, { transform: rest, opacity: 1 }]
          : [{ transform: rest, opacity: 1 }, { transform: 'translateX(-50%) translateY(10px)', opacity: 1, offset: 0.12 }, { transform: off, opacity: 0.5 }],
        { duration: reduce ? 1 : show ? 1800 : 2600, easing: show ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'cubic-bezier(0.55, 0, 0.7, 0.2)', fill: 'forwards' }
      );
      cloudAnim.finished.then(() => { if (!cloudUp) el.style.visibility = 'hidden'; }).catch(() => {});
    }

    // POSTUP: leaning back against a wall, head turned to the side, left leg
    // forward. Held pose with a slight idle breath in the arms.
    const DEG = Math.PI / 180;
    const PostUp = () => new skinview3d.FunctionAnimation((player, progress) => {
      const t = progress * 2;
      const bob = Math.sin(progress * 1.6) * 0.35;   // gentle float, shared with the cloud
      player.rotation.x = -20 * DEG;            // lean back into the cloud
      player.position.y = bob;
      player.skin.head.rotation.set(18 * DEG, 0, 0);  // head level, facing the viewer
      player.skin.body.rotation.set(0, 0, 0);
      player.skin.leftLeg.rotation.set(-25 * DEG, 0, 0);  // left leg forward
      player.skin.rightLeg.rotation.set(0, 0, 0);
      player.skin.leftArm.rotation.set(0, 0, 0.03 * Math.cos(t) + 0.02 * Math.PI);
      player.skin.rightArm.rotation.set(0, 0, 0.03 * Math.cos(t + Math.PI) - 0.02 * Math.PI);
      $('leanCloudBody').style.transform = `translateY(${-bob * 14}px)`;
    });
    // JOJO: upside down and tilted, one arm overhead past the head, the other
    // hanging toward the feet, head turned to show the face. Slight sway.
    const Jojo = () => new skinview3d.FunctionAnimation((player, progress) => {
      const sway = Math.sin(progress * 1.4) * 2;
      player.rotation.order = 'YXZ';
      player.rotation.set(0, -20 * DEG, (200 + sway) * DEG);
      player.skin.head.rotation.set(-15 * DEG, -50 * DEG, 0);
      player.skin.body.rotation.set(0, 0, 0);
      player.skin.leftArm.rotation.set(-170 * DEG, 0, 0);
      player.skin.rightArm.rotation.set(0, 0, 10 * DEG);
      player.skin.leftLeg.rotation.set(-48 * DEG, 0, 0);
      player.skin.rightLeg.rotation.set(-2 * DEG, 0, 0);
    });
    const ANIMS = {
      idle: () => new skinview3d.IdleAnimation(), walk: () => new skinview3d.WalkingAnimation(), postup: PostUp, jojo: Jojo,
    };
    $('anim').onclick = (e) => {
      const btn = e.target.closest('[data-anim]');
      if (!btn) return;
      $('anim').querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', b === btn));
      const make = ANIMS[btn.dataset.anim];
      viewer.animation = make ? make() : null;
      viewer.playerObject.rotation.order = 'XYZ';
      leanCloud(btn.dataset.anim === 'postup');
    };
  } else {
    view.innerHTML = '<p class="micro mono center" style="padding-top:40%">3D PREVIEW UNAVAILABLE</p>';
  }

  // ---------- Outfits ----------
  const fullName = (o) => (o.color ? `${o.name} ${o.color}` : o.name);
  // Cards show the name with the pictured colourway in small type underneath.
  const nameOnly = (o) => `<span class="outfit-name">${o.name}</span>`;

  // Three-up carousel of cards with side buttons (used for shirts and pants).
  function carousel(listEl, prevBtn, nextBtn) {
    const update = () => {
      prevBtn.disabled = listEl.scrollLeft <= 2;
      nextBtn.disabled = listEl.scrollLeft + listEl.clientWidth >= listEl.scrollWidth - 2;
    };
    const step = () => {
      const card = listEl.querySelector('.outfit');
      return card ? card.getBoundingClientRect().width + 8 : listEl.clientWidth / 3;
    };
    prevBtn.onclick = () => listEl.scrollBy({ left: -step() });
    nextBtn.onclick = () => listEl.scrollBy({ left: step() });
    listEl.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Rebuild the cards without jumping the scroll position; when the selected
    // card changes (e.g. a shirt picks its pants) and is out of view, scroll to it.
    let lastPicked = -1;
    return (cards) => {
      const keep = listEl.scrollLeft;
      listEl.replaceChildren(...cards);
      listEl.style.scrollBehavior = 'auto';
      listEl.scrollLeft = keep;
      listEl.style.scrollBehavior = '';
      const picked = cards.findIndex((c) => c.getAttribute('aria-pressed') === 'true');
      if (picked !== lastPicked && picked >= 0) {
        const c = cards[picked];
        const left = c.getBoundingClientRect().left - listEl.getBoundingClientRect().left + listEl.scrollLeft;
        if (left < listEl.scrollLeft || left + c.offsetWidth > listEl.scrollLeft + listEl.clientWidth) {
          listEl.scrollTo({ left: Math.min(left, listEl.scrollWidth - listEl.clientWidth) });
        }
      }
      lastPicked = picked;
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

  // Pants texture: the kind's file (per shoe) recoloured to the wash, with
  // tartan boxers if picked.
  const pantsSrc = (p, shoe = state.shoe) => (p.shoes ? p.shoes[shoe] || Object.values(p.shoes)[0] : p.src);
  const tartan = (p, boxer = state.boxer) => !!p.boxers && boxer === 'tartan';
  const pantsKey = (p, shoe, boxer) => `${pantsSrc(p, shoe)}|${p.wash}|${tartan(p, boxer)}`;
  const washed = {};
  const loadPants = async (p, shoe = state.shoe, boxer = state.boxer) => {
    const key = pantsKey(p, shoe, boxer);
    if (washed[key]) return washed[key];
    // Tartan first: once washed, darker denim falls in the boxers' blue range.
    let d = await loadData(pantsSrc(p, shoe));
    if (tartan(p, boxer)) d = SkinLib.tartanBoxers(d);
    return (washed[key] = SkinLib.washPants(d, p.wash));
  };

  // Pants thumbnails: the fronts of both legs (pants layer over base), side by side.
  const pantsThumbs = {};
  async function pantsThumb(p) {
    const key = pantsKey(p);
    if (pantsThumbs[key]) return pantsThumbs[key];
    const d = await loadPants(p);
    const c = document.createElement('canvas');
    c.width = 8; c.height = 12;
    const ctx = c.getContext('2d');
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = 64;
    tmp.getContext('2d').putImageData(d, 0, 0);
    for (const [sx, sy, dx] of [[4, 20, 0], [4, 36, 0], [20, 52, 4], [4, 52, 4]]) ctx.drawImage(tmp, sx, sy, 4, 12, dx, 0, 4, 12);
    return (pantsThumbs[key] = c.toDataURL());
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
    const shirts = lineShirts();
    const thumbs = await Promise.all(shirts.map((k) => {
      const o = cover(k);
      if (o.locked) return null;
      const body = setFor(o)[state.body] ? state.body : bodiesOf(o)[0];
      return shirtThumb(setFor(o)[body], body === 'slim');
    }));
    if (id !== drawId) return; // a newer redraw started
    fillShirts(shirts.map((k, i) => { const o = k.current, c = cover(k); return card(
      !state.noTop && o.kind === state.outfit.kind,
      c.locked
        ? `<div class="locked-thumb" aria-hidden="true"></div>${nameOnly(c)}`
        : `<img class="ghost-thumb" src="${thumbs[i]}" alt="">${nameOnly(c)}`,
      () => selectOutfit(o)
    ); }));
    drawColors($('shirtColors'), state.outfit, (c) => selectOutfit(c));
    if (state.noTop) $('shirtColors').hidden = true;
    drawPants();
  }

  async function drawPants() {
    $('pantsSection').hidden = false;
    const pants = PANTS; // every bottom shows under both lines
    const thumbs = await Promise.all(pants.map((k) => pantsThumb(k.current)));
    fillPants(pants.map(({ current: p }, i) => card(
      !state.noBottom && p.kind === state.pants.kind,
      `<img class="pants-thumb" src="${thumbs[i]}" alt="">${nameOnly(p)}`,
      () => pickPants(p)
    )));
    drawColors($('pantsColors'), state.pants, pickPants);
    if (state.noBottom) $('pantsColors').hidden = true;
    // Only the shoes these pants come in; a missing pick shows the first pair.
    const shoes = Object.keys(state.pants.shoes || {});
    const shoe = shoes.includes(state.shoe) ? state.shoe : shoes[0];
    $('shoeSection').hidden = shoes.length < 2;
    showOnly($('shoe'), 'shoe', shoes);
    $('shoe').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', !state.noShoes && b.dataset.shoe === shoe));
    $('boxerSection').hidden = !state.pants.boxers || state.noBottom;
    $('tuckSection').hidden = !canTuck();
    $('boxer').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.boxer === state.boxer));
  }
  // Tuck: tucked shows the pants' waistband; untucked lets the shirt hang over it.
  // Cropped tops and skirts (noTuck) have nothing to tuck: always tucked, control hidden.
  const canTuck = () => !state.noTop && !state.noBottom && !state.outfit.cropped && !state.pants.noTuck;
  const drawTuck = () => $('tuck').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', (b.dataset.tuck === 'in') === state.tucked));
  drawTuck();
  $('tuck').onclick = (e) => {
    const btn = e.target.closest('[data-tuck]');
    if (!btn || (btn.dataset.tuck === 'in') === state.tucked) return;
    state.tucked = btn.dataset.tuck === 'in';
    state.fadeNext = true;
    drawTuck();
    render();
  };
  for (const key of ['shoe', 'boxer']) {
    $(key).onclick = (e) => {
      const btn = e.target.closest(`[data-${key}]`);
      if (!btn) return;
      if (key === 'shoe' && state.noShoes) state.noShoes = false;      // any shoe puts shoes back on
      else if (btn.dataset[key] === state[key]) return;
      state[key] = btn.dataset[key];
      state.fadeNext = true;
      drawPants();
      render();
    };
  }

  function pickPants(p) {
    state.fadeNext = true;
    p.kind.current = p;
    state.pants = p;
    state.pantsPicked = true;
    state.noBottom = false;
    state.noShoes = false;
    drawPants();
    render();
  }

  // Colour picker for the selected kind.
  function drawColors(el, selected, onPick) {
    // One row: a dot per colour (in catalogue order), then the picked colourway's
    // name. A kind with one colour shows just its name (nothing to choose).
    const colors = selected.kind.colors;
    el.hidden = false;
    if (el._kind !== selected.kind) {
      el._kind = selected.kind;
      const dots = document.createElement('div');
      dots.className = 'sw-dots';
      dots.hidden = colors.length < 2;
      for (const c of colors) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch-btn';
        b._color = c;
        // Twin colourways get a dot split 50/50 between their two colours.
        const sw = Array.isArray(c.swatch)
          ? `linear-gradient(90deg, ${c.swatch[0]} 50%, ${c.swatch[1]} 50%)`
          : c.swatch || '#ccc';
        b.innerHTML = `<span class="dot" style="background:${sw}"></span>`;
        b.setAttribute('aria-label', c.color);
        b.title = c.color;
        b.onclick = () => onPick(c);
        dots.appendChild(b);
      }
      const name = document.createElement('span');
      name.className = 'sw-label';
      name.setAttribute('aria-live', 'polite');
      el.replaceChildren(dots, name);
    }
    for (const b of el.querySelectorAll('.swatch-btn')) b.setAttribute('aria-pressed', b._color === selected);
    el.querySelector('.sw-label').textContent = selected.color || '';
  }

  // ---------- Sleeve ----------
  function updateSleeveButtons() {
    const o = state.outfit;
    showOnly($('sleeve'), 'sleeve', sleevesOf(o));
    // Only one sleeve length? Nothing to choose, so hide the whole control.
    $('sleeveSection').hidden = sleevesOf(o).length < 2 || state.noTop;
    $('sleeve').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.sleeve === sleeveFor(o)));
  }
  $('sleeve').onclick = (e) => {
    const btn = e.target.closest('[data-sleeve]');
    if (!btn) return;
    state.sleeve = btn.dataset.sleeve;
    updateSleeveButtons();
    setBody(state.body); // bodies can differ per sleeve; also redraws and renders
  };

  // GOOD® / BABY® toggle: a filter for the shirt cards; it never changes the outfit.
  const drawLine = () => $('line').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.line === state.line));
  drawLine();
  $('line').onclick = (e) => {
    const btn = e.target.closest('[data-line]');
    if (!btn || btn.dataset.line === state.line) return;
    state.line = btn.dataset.line;
    drawLine();
    // Only the cards change: whatever is on (shirt, pants, shoe) stays on, so a
    // BABY® top can be worn with pants picked under GOOD® and back again.
    drawOutfits();
  };

  function selectOutfit(o) {
    state.fadeNext = true;
    o.kind.current = o;
    state.outfit = o;
    state.noTop = false;
    if (!state.pantsPicked) {
      state.pants = ALL_PANTS.find((p) => p.id === o.pants) || PANTS[0].current;
    }
    updateSleeveButtons();
    // (Preview-only is already shown on the download button; this line is for errors.)
    $('outfitHint').hidden = true;
    $('outfitHint').textContent = '';
    setBody(state.body); // re-checks the body is available for this outfit
  }

  // ---------- Body ----------
  // Slim (female) bodies keep the user's hair by default; Classic starts without it.
  function setBody(body, why) {
    const available = bodiesOf(state.outfit);
    if (!available.includes(body)) {
      body = available[0];
      why = `${fullName(state.outfit)} COMES IN ${body.toUpperCase()} ONLY`;
    }
    showOnly($('body'), 'body', available);
    // Hair resets to the detected length only for a new skin or a new body,
    // not when an outfit, colour or sleeve re-checks the body.
    if (body !== state.body || state.newSkin) setHair(body === 'slim' ? state.hairGuess : 0, false);
    state.newSkin = false;
    state.body = body;
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
    state.fromName = false; // set by the username form: only then can the look link carry the name
    resetErasers();
    $('uploadTitle').textContent = name;
    $('uploadSub').textContent = isDemo ? 'DEMO / TAP TO UPLOAD YOURS' : 'TAP TO SWAP SKIN';
    drawFace();
    setTone(SkinLib.sampleSkinTone(data), false);
    state.hairGuess = SkinLib.estimateHairRows(data, state.tone);
    const slim = SkinLib.detectSlim(data);
    state.newSkin = true;
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
      state.fromName = true;
      syncUrl();
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
    if (rerender) setKeepSkin(false, false); // picking a tone means using it
    const hex = toHex(rgb);
    $('tone').value = hex;
    $('swatch').style.background = hex;
    $('ramp').innerHTML = [1, 0, -1, -1.5, -2, -3]
      .map((s) => `<span style="background:${toHex(SkinLib.shadeTone(rgb, s))}"></span>`).join('');
    if (rerender) render();
  }
  $('tone').oninput = (e) => setTone(fromHex(e.target.value));
  // MY SKIN: keep the player's own skin texture on bare arms, legs and midriff.
  function setKeepSkin(on, rerender = true) {
    state.keepSkin = on;
    $('mySkin').setAttribute('aria-pressed', on);
    $('toneRow').classList.toggle('off', on);
    if (rerender) render();
  }
  $('mySkin').onclick = () => setKeepSkin(!state.keepSkin);
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
    const noTop = state.noTop;
    const locked = !noTop && o.locked;
    let outfit;
    try {
      outfit = noTop ? EMPTY_OUTFIT : await loadOutfit(o, state.body);
      let pants = null;
      if (!state.noBottom || !state.noShoes) {
        pants = await loadPants(state.pants);
        if (state.noBottom) pants = shoePart(pants, true);         // just the shoes
        else if (state.noShoes) pants = shoePart(pants, false);    // the pants, barefoot
      }
      outfit = SkinLib.combineOutfit(outfit, pants, state.tucked || !canTuck());
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
    if (!noTop) lastGood = o;
    syncUrl();
    drawSlots();
    const slim = state.body === 'slim';
    const args = [state.tone, slim, state.hair, state.erased, state.headwear, state.keepSkin];
    const merged = SkinLib.mergeSkin(state.user, outfit, ...args);
    // Outfits that go over the head (CROPPIE®) replace the hat layer.
    if (!noTop && o.hat) {
      for (let y = 0; y < 16; y++) {
        const i = (y * 64 + 32) * 4;
        merged.data.set(outfit.data.subarray(i, i + 32 * 4), i);
      }
    }
    // Eraser maps: for preview-only outfits, draw them without the outfit.
    state.merged = locked ? SkinLib.mergeSkin(state.user, EMPTY_OUTFIT, ...args) : merged;
    state.hairKeys = new Set(
      state.user ? SkinLib.extractHair(state.user, state.tone, state.hair).map((p) => p.x + ',' + p.y) : []
    );
    drawHairMap();

    const flat = $('flat');
    const texture = flat.closest('details');
    const dl = $('download');
    // The PNG can't carry the arm model, so tell people what to pick in Minecraft.
    $('downloadHint').innerHTML = locked ? '' : `SAVES AS <strong>${slim ? 'SLIM' : 'CLASSIC'}</strong>. CHOOSE THE ${slim ? 'SLIM (ALEX)' : 'CLASSIC (STEVE)'} MODEL WHEN YOU UPLOAD IT TO MINECRAFT.`;
    if (locked) {
      // Nothing downloadable: no texture view, no data URL, straight to 3D.
      flat.getContext('2d').clearRect(0, 0, 64, 64);
      texture.hidden = true;
      texture.open = false;
      state.resultUrl = null;
      dl.disabled = true;
      dl.firstChild.textContent = 'PREVIEW ONLY ';
      dl.title = `${fullName(o)} can be previewed but not downloaded`;
      showSkin(withLeaves(merged.data, slim), slim);
      return;
    }
    texture.hidden = false;
    flat.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
    state.resultUrl = flat.toDataURL('image/png');
    const bare = state.noTop && state.noBottom;
    dl.disabled = state.isDemo || bare;
    dl.firstChild.textContent = bare ? 'PERVERT! ' : 'GOOD® ME ';
    dl.title = bare ? 'Equip clothes first before downloading' : state.isDemo ? 'Upload your skin first' : '';
    if (bare) $('downloadHint').textContent = 'EQUIP CLOTHES FIRST BEFORE DOWNLOADING.';
    showSkin(withLeaves(merged.data, slim), slim);
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
    if ((state.outfit.locked && !state.noTop) || !state.resultUrl || (state.noTop && state.noBottom)) return;
    const a = document.createElement('a');
    a.href = state.resultUrl;
    a.download = `${(state.userName || 'skin').replace(/[^A-Za-z0-9_-]/g, '')}GOOD.png`;
    a.click();
  };

  // ---------- Fig leaves ----------
  // With the bottom off, a fig leaf covers the groin; with the top off on the
  // Slim body, two small leaves cover the chest. Painted on the outer layer of
  // the 3D preview only; the downloaded PNG never has them.
  const LEAF = { G: [79, 138, 58], D: [47, 90, 36], V: [124, 179, 90] };
  const GROIN = [  // 8 wide: torso front rows 8-11, then the top two rows of the legs
    '...GG...',
    '.G.VV.G.',
    '.GGVDGG.',
    '..GVGG..',
    '..GVGD..',
    '...DD...',
  ];
  const CHEST = ['.G.', 'GVG', 'DG.'];   // one small leaf; mirrored for the other side
  // Preview only: the leaves go on a copy for the 3D model, never into the PNG.
  const withLeaves = (data, slim) => {
    if (!state.noTop && !state.noBottom) return data;
    const copy = new Uint8ClampedArray(data);
    figLeaves(copy, slim);
    return copy;
  };
  function figLeaves(px, slim) {
    const put = (x, y, ch) => {
      if (ch === '.') return;
      const i = (y * 64 + x) * 4;
      px.set([...LEAF[ch], 255], i);
    };
    if (state.noBottom) {
      GROIN.forEach((row, r) => [...row].forEach((ch, c) => {
        if (r < 4) put(20 + c, 44 + r, ch);                   // torso outer front, rows 8-11
        else if (c < 4) put(4 + c, 36 + (r - 4), ch);           // right leg outer front, rows 0-1
        else put(4 + (c - 4), 52 + (r - 4), ch);                // left leg outer front, rows 0-1
      }));
    }
    if (state.noTop && slim) {
      CHEST.forEach((row, r) => [...row].forEach((ch, c) => {
        put(20 + c, 36 + 2 + r, ch);                            // left of the chest
        put(20 + 7 - c, 36 + 2 + r, ch);                        // right, mirrored, a gap between
      }));
    }
  }

  // ---------- Shoes ----------
  // The shoes are drawn into the pants files: the bottom two rows of each leg
  // (both layers) and the soles. keep=true keeps only those; false removes them.
  const isShoe = (x, y) =>
    (y >= 30 && y <= 31 && x < 16) || (y >= 16 && y <= 19 && x >= 8 && x < 12) ||          // right leg base
    (y >= 46 && y <= 47 && x < 16) || (y >= 32 && y <= 35 && x >= 8 && x < 12) ||          // right leg outer
    (y >= 62 && y <= 63 && x >= 16 && x < 32) || (y >= 48 && y <= 51 && x >= 24 && x < 28) || // left leg base
    (y >= 62 && y <= 63 && x < 16) || (y >= 48 && y <= 51 && x >= 8 && x < 12);             // left leg outer
  function shoePart(src, keep) {
    const data = new Uint8ClampedArray(src.data);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      if (isShoe(x, y) !== keep) data[(y * 64 + x) * 4 + 3] = 0;
    }
    return { width: 64, height: 64, data };
  }
  const SHOE_SWATCH = { black: '#1b1b1f', brown: '#5a1e14', tobacco: '#b57a36', sneak01: ['#f4f4f2', '#0000ff'] };
  const shoeKey = () => { const s = Object.keys(state.pants.shoes || {}); return s.includes(state.shoe) ? state.shoe : s[0]; };
  const shoeName = () => { const b = $('shoe').querySelector(`[data-shoe="${shoeKey()}"]`); return b ? b.textContent.trim() : 'SHOES'; };
  async function shoeThumb() {
    const d = await loadPants(state.pants);
    const tex = document.createElement('canvas'); tex.width = tex.height = 64;
    tex.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(d.data), 64, 64), 0, 0);
    const c = document.createElement('canvas'); c.width = 8; c.height = 4;
    const ctx = c.getContext('2d');
    // fronts of both feet, base then outer: rows 10-11 of each leg
    for (const [sx, sy, dx] of [[4, 30, 0], [4, 46, 0], [20, 62, 4], [4, 62, 4]]) ctx.drawImage(tex, sx, sy, 4, 2, dx, 1, 4, 2);
    return c.toDataURL();
  }

  // ---------- Equipped ----------
  // Squares by the model: what's on right now (piece + colour). Hover shows an
  // ×; clicking takes that piece off. Picking a card puts it back on.
  let slotsId = 0;
  const swatchBg = (c) => (Array.isArray(c.swatch) ? `linear-gradient(90deg, ${c.swatch[0]} 50%, ${c.swatch[1]} 50%)` : c.swatch || '#ccc');
  async function drawSlots() {
    const box = $('equipped');
    if (!box) return;
    const id = ++slotsId;
    const o = state.outfit, p = state.pants;
    const topBody = bodiesOf(o).includes(state.body) ? state.body : bodiesOf(o)[0];
    const slots = [
      { label: 'TOP', item: state.noTop ? null : o,
        thumb: () => (o.locked ? null : shirtThumb(setFor(o)[topBody], topBody === 'slim')),
        off: () => { state.noTop = true; } },
      { label: 'BOTTOM', item: state.noBottom ? null : p,
        thumb: () => pantsThumb(p),
        off: () => { state.noBottom = true; } },
      { label: 'SHOES', item: state.noShoes || !state.pants.shoes ? null : { name: shoeName(), swatch: SHOE_SWATCH[shoeKey()] || '#888' },
        thumb: () => shoeThumb(),
        off: () => { state.noShoes = true; } },
    ];
    const thumbs = await Promise.all(slots.map((s) => (s.item ? s.thumb() : null)));
    if (id !== slotsId) return;
    box.replaceChildren(...slots.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'eq-slot';
      if (!s.item) {
        b.classList.add('eq-empty');
        b.disabled = true;
        b.innerHTML = `<span class="eq-none mono">NO ${s.label}</span>`;
        b.setAttribute('aria-label', `No ${s.label.toLowerCase()} on`);
        return b;
      }
      const name = fullName(s.item);
      b.title = `${name}. Click to take it off.`;
      b.setAttribute('aria-label', `${name}. Take it off`);
      b.innerHTML = (thumbs[i] ? `<img src="${thumbs[i]}" alt="">` : '<span class="eq-locked"></span>') + '<span class="eq-dot"></span><span class="eq-x" aria-hidden="true">×</span>';
      b.querySelector('.eq-dot').style.background = swatchBg(s.item);
      b.onclick = () => {
        s.off();
        state.fadeNext = true;
        updateSleeveButtons();
        drawOutfits();
        render();
      };
      return b;
    }));
  }

  // ---------- Look links ----------
  // A look is a recipe: shirt + pants colour ids and the options in effect
  // (?u=<name>&top=<id>&bottom=<id>&shoe=&sleeve=&body=&tuck=out&boxer=tartan).
  // The address bar follows the look, so any outfit can be copied and shared.
  let booted = false;
  const allTops = () => SHIRTS.flatMap((k) => k.colors);
  const topById = (id) => allTops().find((c) => c.id === id);
  const pantsById = (id) => ALL_PANTS.find((p) => p.id === id);
  function currentLook(withName = true) {
    const o = state.outfit, p = state.pants;
    const L = {};
    if (withName && state.fromName && state.userName) L.u = state.userName;
    if (!state.noTop) L.top = o.id;
    if (!state.noBottom) L.bottom = p.id;
    const shoes = Object.keys(p.shoes || {});
    if (!state.noShoes && shoes.length > 1) L.shoe = shoes.includes(state.shoe) ? state.shoe : shoes[0];
    if (state.noShoes) L.feet = 'bare';
    if (!state.noTop && sleevesOf(o).length > 1) L.sleeve = sleeveFor(o);
    if (bodiesOf(o).length > 1) L.body = state.body;
    if (canTuck() && !state.tucked) L.tuck = 'out';
    if (!state.noBottom && p.boxers && state.boxer === 'tartan') L.boxer = 'tartan';
    return L;
  }
  const lookUrl = (L) => `${location.origin}${location.pathname}?${new URLSearchParams(L)}`;
  function syncUrl() {
    if (booted) history.replaceState(null, '', lookUrl(currentLook()));
  }
  function lookFromUrl() {
    const q = new URLSearchParams(location.search);
    if (!q.get('top') && !q.get('bottom')) return null;
    return Object.fromEntries(['u', 'top', 'bottom', 'shoe', 'feet', 'sleeve', 'body', 'tuck', 'boxer'].filter((k) => q.get(k)).map((k) => [k, q.get(k)]));
  }
  // Put a look on. withSkin: also load the player named in it (shared links);
  // gallery picks keep your own skin.
  async function applyLook(L, withSkin) {
    const top = topById(L.top), bottom = pantsById(L.bottom);
    if (['short', 'long'].includes(L.sleeve)) state.sleeve = L.sleeve;
    if (['black', 'brown', 'tobacco', 'sneak01'].includes(L.shoe)) state.shoe = L.shoe;
    state.boxer = L.boxer === 'tartan' ? 'tartan' : 'blue';
    state.tucked = L.tuck !== 'out';
    drawTuck();
    if (bottom) { bottom.kind.current = bottom; state.pants = bottom; state.pantsPicked = true; }
    state.noTop = !top;
    state.noBottom = !bottom;
    state.noShoes = L.feet === 'bare';
    if (top) {
      if (top.kind.line !== 'both' && top.kind.line !== state.line) { state.line = top.kind.line; drawLine(); }
      top.kind.current = top;
      state.outfit = top;
    }
    updateSleeveButtons();
    if (withSkin && /^[A-Za-z0-9_]{3,16}$/.test(L.u || '')) {
      $('username').value = L.u;
      $('userForm').classList.add('loading');
      try {
        useSkin(await skinForName(L.u), L.u, false);
        state.fromName = true;
      } catch (err) {
        showError(err.message);
      } finally {
        $('userForm').classList.remove('loading');
      }
    }
    setBody(['classic', 'slim'].includes(L.body) ? L.body : state.body);
  }

  const shareHint = (msg) => { $('shareHint').textContent = msg; };
  $('shareLook').onclick = async () => {
    const url = lookUrl(currentLook());
    const title = `${fullName(state.noTop ? state.pants : state.outfit)} · GOOD®`;
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      shareHint('LINK COPIED. PASTE IT ANYWHERE.');
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  // ---------- GOOD® GALLERY ----------
  // The newest posted looks, each rebuilt from the player's own skin and drawn
  // as a flat front view. Tap one to put it on your skin.
  const GALLERY_PAGE = 24;
  let galleryLooks = [];
  let galleryShown = 0;
  const skinCache = {};
  const skinOf = (name) => (skinCache[name.toLowerCase()] ||= skinForName(name));

  async function composeLook(user, L) {
    const o = topById(L.top), p = pantsById(L.bottom);
    if (!o || !p || o.locked) throw new Error('unavailable');
    const sleeve = sleeveFor(o, L.sleeve);
    const set = setFor(o, sleeve);
    const detected = SkinLib.detectSlim(user) ? 'slim' : 'classic';
    const body = set[L.body] ? L.body : set[detected] ? detected : Object.keys(set)[0];
    const shoes = Object.keys(p.shoes || {});
    const shoe = shoes.includes(L.shoe) ? L.shoe : shoes[0];
    let outfit = await loadOutfit(o, body, sleeve);
    outfit = SkinLib.combineOutfit(outfit, await loadPants(p, shoe, L.boxer), L.tuck !== 'out' || o.cropped || p.noTuck);
    const slim = body === 'slim';
    const tone = SkinLib.sampleSkinTone(user);
    const merged = SkinLib.mergeSkin(user, outfit, tone, slim, slim ? SkinLib.estimateHairRows(user, tone) : 0, null, 'keep', false);
    if (o.hat) {
      for (let y = 0; y < 16; y++) {
        const i = (y * 64 + 32) * 4;
        merged.data.set(outfit.data.subarray(i, i + 32 * 4), i);
      }
    }
    return { merged, slim, o, p };
  }
  // Front view, 16×32: head, torso, arms and legs, outer layer over base.
  function frontView(merged, slim) {
    const tex = document.createElement('canvas');
    tex.width = tex.height = 64;
    tex.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
    const c = document.createElement('canvas');
    c.width = 16; c.height = 32;
    const ctx = c.getContext('2d');
    const a = slim ? 3 : 4;
    // [x, y, w, h, dest x, dest y]: base, then the outer layer
    for (const [x, y, w, h, dx, dy] of [
      [8, 8, 8, 8, 4, 0], [40, 8, 8, 8, 4, 0],
      [20, 20, 8, 12, 4, 8], [20, 36, 8, 12, 4, 8],
      [44, 20, a, 12, 4 - a, 8], [44, 36, a, 12, 4 - a, 8],
      [36, 52, a, 12, 12, 8], [52, 52, a, 12, 12, 8],
      [4, 20, 4, 12, 4, 20], [4, 36, 4, 12, 4, 20],
      [20, 52, 4, 12, 8, 20], [4, 52, 4, 12, 8, 20],
    ]) ctx.drawImage(tex, x, y, w, h, dx, dy, w, h);
    return c;
  }
  function galleryCard(L) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gal-card';
    btn.hidden = true; // shown once it renders
    btn.innerHTML = '<span class="gal-fig"></span><span class="gal-name mono"></span><span class="gal-piece"></span><span class="gal-color micro mono"></span>';
    btn.onclick = () => {
      applyLook(L, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    (async () => {
      try {
        const { merged, slim, o, p } = await composeLook(await skinOf(L.u), L);
        btn.querySelector('.gal-fig').append(frontView(merged, slim));
        btn.querySelector('.gal-name').textContent = L.u;
        btn.querySelector('.gal-piece').textContent = o.name;
        btn.querySelector('.gal-color').textContent = [o.color, `${p.name}${p.color ? ' ' + p.color : ''}`].filter(Boolean).join(' / ');
        btn.setAttribute('aria-label', `${L.u} in ${fullName(o)} and ${fullName(p)}. Try it on.`);
        btn.hidden = false;
      } catch {
        btn.remove(); // player renamed, default skin, or a retired piece
      }
    })();
    return btn;
  }
  function showMoreLooks() {
    const next = galleryLooks.slice(galleryShown, galleryShown + GALLERY_PAGE);
    galleryShown += next.length;
    $('galleryGrid').append(...next.map(galleryCard));
    $('galleryMore').hidden = galleryShown >= galleryLooks.length;
  }
  async function loadGallery() {
    try {
      const r = await fetch('api/gallery');
      if (!r.ok) throw new Error();
      galleryLooks = (await r.json()).looks || [];
    } catch {
      $('gallery').hidden = true; // not set up (e.g. local dev): no section at all
      return;
    }
    $('gallery').hidden = false;
    $('galleryMsg').textContent = galleryLooks.length ? '' : 'NOTHING HERE YET. BE THE FIRST.';
    showMoreLooks();
  }
  $('galleryMore').onclick = showMoreLooks;

  $('postLook').onclick = async () => {
    if (!state.fromName) return shareHint('LOAD YOUR SKIN BY USERNAME TO POST YOUR LOOK.');
    if (state.noTop || state.noBottom) return shareHint('PUT ON A TOP AND A BOTTOM TO POST YOUR LOOK.');
    if (state.outfit.locked) return shareHint('PREVIEW-ONLY PIECES CAN’T BE POSTED.');
    const btn = $('postLook');
    btn.disabled = true;
    shareHint('POSTING…');
    try {
      const r = await fetch('api/gallery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentLook(), website: '' }),
      });
      if (r.status === 429) return shareHint('SLOW DOWN. TRY AGAIN IN A MINUTE.');
      if (!r.ok) throw new Error();
      const { look } = await r.json();
      // Replace this player's old card with the new one, on top.
      const shown = galleryLooks.slice(0, galleryShown).some((l) => l.u.toLowerCase() === look.u.toLowerCase());
      galleryLooks = [look, ...galleryLooks.filter((l) => l.u.toLowerCase() !== look.u.toLowerCase())];
      if (!shown) galleryShown++; // one more card on screen
      $('galleryMore').hidden = galleryShown >= galleryLooks.length;
      $('galleryGrid').querySelectorAll('.gal-card').forEach((c) => { if (c.querySelector('.gal-name').textContent.toLowerCase() === look.u.toLowerCase()) c.remove(); });
      $('galleryGrid').prepend(galleryCard(look));
      $('galleryMsg').textContent = '';
      $('gallery').hidden = false;
      shareHint('POSTED TO THE GOOD® GALLERY.');
    } catch {
      shareHint('COULDN’T POST. TRY AGAIN.');
    } finally {
      btn.disabled = false;
    }
  };

  // ---------- Boot with the demo head ----------
  updateSleeveButtons();
  setHeadwear('keep', false);
  updateEraseHint();
  updateEraserButtons();
  setBody('classic');
  const linked = lookFromUrl();
  loadData(DEMO_SKIN).then((d) => useSkin(d, 'Chinny', true)).catch(() => render())
    .then(() => linked && applyLook(linked, true))
    .finally(() => { booted = true; if (linked) syncUrl(); }); // a plain visit keeps a clean address until something changes
  loadGallery();
})();
