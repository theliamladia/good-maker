// GOOD® CRATE: a Minecraft-style crate in GOOD® BLUE (16×16 pixel faces,
// chrome corners, the new G stamped on the sides), lid propped open, with the
// GOODIE® I'M SOWWY peeking out. The GOODIE® is a preview-only piece: its
// texture comes scrambled from /api/outfit and is decoded straight to pixels
// (no image URL or PNG), the same way THE MAKER previews it.
(() => {
  const canvas = document.getElementById('crate');
  if (!canvas || !window.THREE) return;
  const T = window.THREE;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Pixel textures ----------
  const tex = (c) => { const t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.colorSpace = T.SRGBColorSpace; return t; };
  const px = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); return c; };
  // Seeded noise so the planks look the same on every visit.
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const hex = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;
  const blue = (k) => hex(0, 0, Math.min(255, 255 * k));
  const G = ['####', '#...', '#.##', '#..#', '####'];

  function crateFace({ g = true, top = false } = {}) {
    return px(16, 16, (x) => {
      for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
        let k = 0.92 + rnd() * 0.12;
        if (top) { if ((i + y) % 16 === 0 || (i - y + 16) % 16 === 0 || (i + y) % 16 === 15) k *= 0.78; }   // braced diagonal
        else if (y % 4 === 3) k *= 0.72;                                                                   // plank seams
        x.fillStyle = blue(k); x.fillRect(i, y, 1, 1);
      }
      x.fillStyle = blue(0.55);                       // frame
      x.fillRect(0, 0, 16, 2); x.fillRect(0, 14, 16, 2); x.fillRect(0, 0, 2, 16); x.fillRect(14, 0, 2, 16);
      x.fillStyle = blue(0.68); x.fillRect(1, 1, 14, 1); x.fillRect(1, 14, 14, 1);
      for (const [cx, cy] of [[0, 0], [13, 0], [0, 13], [13, 13]]) {   // chrome corners with a rivet
        x.fillStyle = '#c9ced6'; x.fillRect(cx, cy, 3, 3);
        x.fillStyle = '#eef1f5'; x.fillRect(cx, cy, 2, 1);
        x.fillStyle = '#7d838c'; x.fillRect(cx + 1, cy + 1, 1, 1);
      }
      if (g) for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) if (G[r][c] === '#') { x.fillStyle = '#f4f4f2'; x.fillRect(6 + c, 5 + r, 1, 1); }
    });
  }
  const inside = px(16, 16, (x) => { for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) { x.fillStyle = blue((0.42 + rnd() * 0.08) * (y % 4 === 3 ? 0.8 : 1)); x.fillRect(i, y, 1, 1); } });

  // ---------- Scene ----------
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 1, 400);
  camera.position.set(0, 36, 60); camera.lookAt(0, 3, 0);
  scene.add(new T.AmbientLight(0xffffff, 1.4));
  const key = new T.DirectionalLight(0xffffff, 2.2); key.position.set(30, 50, 40); scene.add(key);
  const rim = new T.DirectionalLight(0x8899ff, 1.2); rim.position.set(-40, 20, -30); scene.add(rim);

  const root = new T.Group(); scene.add(root);
  const mat = (c, extra = {}) => new T.MeshLambertMaterial({ map: tex(c), ...extra });

  // The crate: an open box (no top), 16 units a side, walls 1 thick.
  const crate = new T.Group(); root.add(crate);
  const side = crateFace(), sideG = crateFace({ g: true }), bottom = crateFace({ g: false });
  const wall = (w, h, d, x, y, z, outer) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), [mat(outer), mat(outer), mat(inside), mat(bottom), mat(outer), mat(outer)]);
    m.position.set(x, y, z); crate.add(m); return m;
  };
  wall(16, 16, 1, 0, 0, 7.5, sideG);   // front
  wall(16, 16, 1, 0, 0, -7.5, sideG);  // back
  wall(1, 16, 14, 7.5, 0, 0, sideG);   // sides
  wall(1, 16, 14, -7.5, 0, 0, sideG);
  wall(14, 1, 14, 0, -7.5, 0, bottom); // floor
  // Inner faces of the walls: darker planks.
  for (const [w, h, x, z, ry] of [[14, 15, 0, 6.99, Math.PI], [14, 15, 0, -6.99, 0], [14, 15, 6.99, 0, -Math.PI / 2], [14, 15, -6.99, 0, Math.PI / 2]]) {
    const p = new T.Mesh(new T.PlaneGeometry(w, h), mat(inside)); p.position.set(x, 0.5, z); p.rotation.y = ry; crate.add(p);
  }

  // The lid, hinged at the back edge and propped open.
  const hinge = new T.Group(); hinge.position.set(0, 8, -8); crate.add(hinge);
  const lid = new T.Mesh(new T.BoxGeometry(16.6, 1.6, 16.6), [mat(side), mat(side), mat(crateFace({ top: true, g: false })), mat(inside), mat(side), mat(side)]);
  lid.position.set(0, 0.8, 8.3); hinge.add(lid);
  let lidOpen = 1.05; hinge.rotation.x = -lidOpen;

  // ---------- The GOODIE® peeking out ----------
  // Skin boxes cut from the 64×64 texture (base layer with the outer layer over it).
  function faceCanvas(img, ox, oy, w, d, h, which, over) {
    const R = { top: [ox + d, oy, w, d], bottom: [ox + d + w, oy, w, d], right: [ox, oy + d, d, h], front: [ox + d, oy + d, w, h], left: [ox + d + w, oy + d, d, h], back: [ox + 2 * d + w, oy + d, w, h] }[which];
    return px(R[2], R[3], (x) => {
      x.putImageData(new ImageData(new Uint8ClampedArray(img.data), 64, 64), -R[0], -R[1]);
      if (over) {
        const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(img.data), 64, 64), 0, 0);
        x.drawImage(c, R[0] + over[0], R[1] + over[1], R[2], R[3], 0, 0, R[2], R[3]);
      }
    });
  }
  function part(img, ox, oy, w, d, h, over) {
    const f = (s) => mat(faceCanvas(img, ox, oy, w, d, h, s, over), { transparent: true, alphaTest: 0.5 });
    // three.js order: +x, -x, +y, -y, +z, -z  →  left, right, top, bottom, front, back
    return new T.Mesh(new T.BoxGeometry(w, h, d), [f('left'), f('right'), f('top'), f('bottom'), f('front'), f('back')]);
  }
  const goodie = new T.Group(); crate.add(goodie);
  const pixels = (bmp) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.drawImage(bmp, 0, 0); return x.getImageData(0, 0, 64, 64); };
  // Preview-only pieces: scrambled by /api/outfit, decoded straight to pixels.
  async function locked(id) {
    const r = await fetch(`api/outfit?id=${id}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('unavailable');
    const { k, d } = await r.json();
    const kb = Uint8Array.from(atob(k), (c) => c.charCodeAt(0));
    const bytes = Uint8Array.from(atob(d), (c, i) => c.charCodeAt(0) ^ kb[i % kb.length]);
    const bmp = await createImageBitmap(new Blob([bytes])); const img = pixels(bmp); bmp.close(); return img;
  }
  async function open(src) { const r = await fetch(src); const bmp = await createImageBitmap(await r.blob()); const img = pixels(bmp); bmp.close(); return img; }

  // The SHIRT® files carry the jean's waistband on the torso's last rows: hem the tee instead (copy row 9 down).
  function hemOnly(img) {
    const d = img.data, at = (x, y) => (y * 64 + x) * 4;
    for (const [y0, from] of [[30, 29], [31, 29], [45, 44], [46, 44], [47, 44]]) for (let x = 16; x < 40; x++) d.copyWithin(at(x, y0), at(x, from), at(x, from) + 4);
    return img;
  }
  // Torso (base 16,16; outer +16 rows) and hood (hat layer 32,0). No arms: just the bodies, folded into the crate.
  const torsoOf = (img) => part(img, 16, 16, 8, 4, 12, [0, 16]);
  const ITEMS = [
    { id: 'sowwy', load: () => locked('goodie-im-sowwy-classic'), hood: true, pos: [0.5, 7.4, 0.8], rot: [-0.12, 0.15, -0.14] },
    { id: 'after-hours', load: () => locked('goodie-black-chrome-classic'), hood: true, pos: [-3.6, 5.2, -2.8], rot: [-0.25, -0.35, 0.32] },
    { id: 'tee', load: () => open('outfits/good-shirt-im-sowwy-classic.png').then(hemOnly), pos: [3.8, 4.2, 3.2], rot: [0.32, 0.4, -0.42] },
  ];
  for (const it of ITEMS) {
    it.ready = it.load().then((img) => {
      it.img = img;
      const t = torsoOf(img); t.position.set(...it.pos); t.rotation.set(...it.rot); goodie.add(t);
      if (it.hood) {
        const h = part(img, 32, 0, 8, 8, 8);
        h.scale.set(0.95, 0.55, 0.95); h.position.set(it.pos[0] + 1.2, it.pos[1] + 5.2, it.pos[2] - 3); h.rotation.set(-0.55, it.rot[1], it.rot[2]); goodie.add(h);
      }
      return img;
    }).catch(() => null);
  }

  // CONTAINS: each piece laid flat, front view (torso with both sleeves), drawn from pixels.
  function flat(img, cv) {
    const src = document.createElement('canvas'); src.width = src.height = 64; src.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(img.data), 64, 64), 0, 0);
    cv.width = 16; cv.height = 12; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    for (const [sx, sy, dx] of [[44, 20, 0], [44, 36, 0], [20, 20, 4], [20, 36, 4], [36, 52, 12], [52, 52, 12]]) x.drawImage(src, sx, sy, sx === 20 ? 8 : 4, 12, dx, 0, sx === 20 ? 8 : 4, 12);
  }
  document.querySelectorAll('[data-item]').forEach((card) => {
    const it = ITEMS.find((i) => i.id === card.dataset.item);
    if (it) it.ready.then((img) => { if (img) flat(img, card.querySelector('canvas')); });
  });

  // ---------- Size, drag to turn, open ----------
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < 0.9 ? 78 : 62;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  let rotY = -0.55, vel = 0, drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: rotY }; canvas.setPointerCapture(e.pointerId); document.getElementById('hint').style.opacity = 0; });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; const nr = drag.r + (e.clientX - drag.x) * 0.01; vel = nr - rotY; rotY = nr; });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  let opening = 0, rise = 0;
  const btn = document.getElementById('open');
  btn.onclick = () => {
    if (opening) return;
    opening = performance.now(); btn.disabled = true; btn.textContent = 'OPENING…';
    setTimeout(() => {
      btn.textContent = 'OPENED';
      document.getElementById('drop').hidden = false;
      document.getElementById('drop').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }, reduce ? 0 : 1400);
  };

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag) { vel *= 0.92; rotY += vel; if (!reduce && Math.abs(vel) < 0.002) rotY += dt * 0.18; }
    root.rotation.y = rotY;
    const t = now / 1000;
    if (opening) {
      const p = reduce ? 1 : Math.min(1, (now - opening) / 1400);
      const e = 1 - (1 - p) ** 3;
      const shake = p < 0.35 && !reduce ? Math.sin(now / 22) * 0.04 * (1 - p / 0.35) : 0;
      crate.rotation.z = shake;
      hinge.rotation.x = -(lidOpen + e * 0.75);
      rise = e * 7;
    } else if (!reduce) {
      hinge.rotation.x = -(lidOpen + Math.sin(t * 2.2) * 0.04);   // the lid breathes
    }
    goodie.position.y = rise + (reduce ? 0 : Math.sin(t * 1.6) * 0.25);
    root.position.y = reduce ? 0 : Math.sin(t * 0.9) * 0.6;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
