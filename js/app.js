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
      btn.innerHTML = `<img src="${o.bodies[state.body]}" alt=""><span>${o.name}</span>`;
      btn.onclick = () => { state.outfit = o; drawOutfits(); render(); };
      $('outfits').appendChild(btn);
    }
  }

  // ---------- Body ----------
  // Slim (female) bodies keep the user's hair by default; Classic starts without it.
  function setBody(body, why) {
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
    $('eraser').hidden = !rows;
    if (rerender) render();
  }
  $('hair').onclick = (e) => {
    const btn = e.target.closest('[data-hair]');
    if (btn) setHair(+btn.dataset.hair);
  };

  // ---------- Upload ----------
  function useSkin(data, name, isDemo) {
    state.user = data;
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

  async function handleFile(file) {
    $('error').hidden = true;
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const data = imageData(await loadImage(url));
      if (data.width !== 64 || (data.height !== 64 && data.height !== 32)) {
        throw new Error(`SKIN MUST BE 64×64 OR 64×32 (GOT ${data.width}×${data.height}).`);
      }
      useSkin(data, file.name.replace(/\.png$/i, ''), false);
    } catch (e) {
      $('error').textContent = e.message;
      $('error').hidden = false;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

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
    const outfit = await loadData(state.outfit.bodies[state.body]);
    if (id !== renderId) return; // a newer render started
    const slim = state.body === 'slim';
    const merged = SkinLib.mergeSkin(state.user, outfit, state.tone, slim, state.hair, state.erased);
    state.merged = merged;
    state.hairKeys = new Set(
      state.user ? SkinLib.extractHair(state.user, state.tone, state.hair).map((p) => p.x + ',' + p.y) : []
    );
    drawHairMap();
    const canvas = $('flat');
    canvas.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
    state.resultUrl = canvas.toDataURL('image/png');
    $('download').disabled = state.isDemo;
    $('download').title = state.isDemo ? 'Upload your skin first' : '';
    if (viewer) viewer.loadSkin(state.resultUrl, { model: slim ? 'slim' : 'default' });
  }

  // ---------- Hair eraser ----------
  // Map of the torso (x 16..40, y 20..32) as seen on the model: jacket layer
  // over base. One map pixel = one skin pixel; erasing a hair pixel lets the
  // outfit show through there.
  const MAP = { x: 16, y: 20, w: 24, h: 12, scale: 12, jacket: 16 };
  const hairMap = $('hairMap');
  let hover = null;

  function drawHairMap() {
    const m = state.merged;
    const ctx = hairMap.getContext('2d');
    ctx.clearRect(0, 0, hairMap.width, hairMap.height);
    if (!m) return;
    const px = (x, y) => m.data.slice((y * 64 + x) * 4, (y * 64 + x) * 4 + 4);
    for (let y = 0; y < MAP.h; y++) {
      for (let x = 0; x < MAP.w; x++) {
        const sx = MAP.x + x, sy = MAP.y + y;
        for (const c of [px(sx, sy), px(sx, sy + MAP.jacket)]) {
          if (!c[3]) continue;
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
          ctx.fillRect(x * MAP.scale, y * MAP.scale, MAP.scale, MAP.scale);
        }
      }
    }
    // Face dividers: R | FRONT | L | BACK
    ctx.fillStyle = 'rgba(11,21,38,0.35)';
    for (const x of [4, 12, 16]) ctx.fillRect(x * MAP.scale - 1, 0, 2, hairMap.height);
    if (hover) {
      ctx.strokeStyle = '#1a5cff';
      ctx.lineWidth = 2;
      ctx.strokeRect(hover[0] * MAP.scale + 1, hover[1] * MAP.scale + 1, MAP.scale - 2, MAP.scale - 2);
    }
  }

  const cellAt = (e) => {
    const r = hairMap.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * MAP.w);
    const y = Math.floor(((e.clientY - r.top) / r.height) * MAP.h);
    return x >= 0 && y >= 0 && x < MAP.w && y < MAP.h ? [x, y] : null;
  };

  let stroke = null;
  let pending = false;
  function eraseAt(cell) {
    if (!cell) return;
    const key = `${MAP.x + cell[0]},${MAP.y + cell[1] + MAP.jacket}`;
    if (!state.hairKeys.has(key) || state.erased.has(key)) return;
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
    const a = document.createElement('a');
    a.href = state.resultUrl;
    a.download = `${state.outfit.id}-${state.body}.png`;
    a.click();
  };

  // ---------- Boot with the demo head ----------
  setBody('classic');
  loadData(DEMO_SKIN).then((d) => useSkin(d, 'Spurdo', true)).catch(() => render());
})();
