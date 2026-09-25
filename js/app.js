(() => {
  const $ = (id) => document.getElementById(id);
  const state = { user: null, outfit: null, outfitData: {}, tone: [224, 172, 140], resultUrl: null };

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

  const toHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
  const fromHex = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  let viewer = null;
  if (window.skinview3d) {
    viewer = new skinview3d.SkinViewer({ canvas: document.createElement('canvas'), width: 240, height: 320 });
    viewer.autoRotate = true;
    viewer.animation = new skinview3d.IdleAnimation();
    $('view3d').appendChild(viewer.canvas);
    $('rotate').onchange = (e) => { viewer.autoRotate = e.target.checked; };
    $('anim').onchange = (e) => {
      const A = { idle: skinview3d.IdleAnimation, walk: skinview3d.WalkingAnimation, run: skinview3d.RunningAnimation };
      viewer.animation = A[e.target.value] ? new A[e.target.value]() : null;
    };
  } else {
    $('view3d').innerHTML = '<p class="hint">3D preview unavailable.</p>';
  }

  // Outfit picker
  window.OUTFITS.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'outfit';
    btn.innerHTML = `<img src="${o.file}" alt=""><span>${o.name}</span>`;
    btn.onclick = () => selectOutfit(o, btn);
    $('outfits').appendChild(btn);
    if (i === 0) selectOutfit(o, btn);
  });

  async function selectOutfit(o, btn) {
    document.querySelectorAll('.outfit').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.outfit = o;
    if (!state.outfitData[o.id]) state.outfitData[o.id] = imageData(await loadImage(o.file));
    render();
  }

  // Upload
  async function handleFile(file) {
    $('error').hidden = true;
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const data = imageData(await loadImage(url));
      if (data.width !== 64 || (data.height !== 64 && data.height !== 32)) {
        throw new Error(`Skin must be 64x64 or 64x32 (got ${data.width}x${data.height}).`);
      }
      state.user = data;
      drawFace();
      setTone(SkinLib.sampleSkinTone(data));
    } catch (e) {
      $('error').textContent = e.message;
      $('error').hidden = false;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  $('file').onchange = (e) => handleFile(e.target.files[0]);
  const drop = $('drop');
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); handleFile(e.dataTransfer.files[0]); };

  // Skin tone
  // Any tone (auto, picker or face click) goes through the same shading rules;
  // the ramp shows the highlight/shadow shades that will be used.
  function setTone(rgb) {
    state.tone = rgb;
    $('tone').value = toHex(rgb);
    $('ramp').innerHTML = [1, 0, -1, -1.5, -2, -3]
      .map((s) => `<span style="background:${toHex(SkinLib.shadeTone(rgb, s))}"></span>`).join('');
    render();
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
    const r = e.target.getBoundingClientRect();
    const x = 8 + Math.floor(((e.clientX - r.left) / r.width) * 8);
    const y = 8 + Math.floor(((e.clientY - r.top) / r.height) * 8);
    const i = (y * state.user.width + x) * 4;
    if (state.user.data[i + 3] > 0) setTone([...state.user.data.slice(i, i + 3)]);
  };

  setTone(state.tone);

  // Result
  function render() {
    const outfit = state.outfit && state.outfitData[state.outfit.id];
    if (!outfit) return;
    const merged = SkinLib.mergeSkin(state.user, outfit, state.tone, state.outfit.slim);
    const canvas = $('flat');
    canvas.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
    state.resultUrl = canvas.toDataURL('image/png');
    $('download').disabled = !state.user;
    $('modelHint').textContent = state.outfit.slim
      ? 'Use the Slim (Alex) model when uploading this skin.'
      : 'Use the Classic (Steve) model when uploading this skin.';
    if (viewer) viewer.loadSkin(state.resultUrl, { model: state.outfit.slim ? 'slim' : 'default' });
  }

  $('download').onclick = () => {
    const a = document.createElement('a');
    a.href = state.resultUrl;
    a.download = `${state.outfit.id}-skin.png`;
    a.click();
  };
})();
