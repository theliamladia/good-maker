// ART® IN MOTION (/inmotion): the GOOD® CRATE Nº002 in 3D. A white crate (16×16
// pixel faces, MARSHMALLOW planks, the G set one pigment per square), lid lifted,
// the season's pieces folded inside. The pieces are preview-only: their textures
// come scrambled from /api/outfit and are decoded straight to pixels. Drag to turn.
// (Adapted from js/crate.js; this crate doesn't open yet.)
(() => {
  const canvas = document.getElementById('crate3d');
  if (!canvas || !window.THREE) return;
  const T = window.THREE;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Pixel textures ----------
  const tex = (c) => { const t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.colorSpace = T.SRGBColorSpace; return t; };
  const px = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); return c; };
  // Seeded noise so the planks look the same on every visit.
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const hex = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;
  const paper = (k) => hex(247 * k, 242 * k, 234 * k);   // MARSHMALLOW, shaded
  const G = ['####', '#...', '#.##', '#..#', '####'];
  const PIGMENTS = ['#f3d88a', '#2e7d6b', '#a8203a', '#4a5560', '#9b4f96', '#3fb0c4', '#0000ff'];

  function crateFace({ g = true, top = false } = {}) {
    return px(16, 16, (x) => {
      for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
        let k = 0.965 + rnd() * 0.035;
        if (top) { if ((i + y) % 16 === 0 || (i - y + 16) % 16 === 0 || (i + y) % 16 === 15) k *= 0.95; }   // braced diagonal
        else if (y % 4 === 3) k *= 0.93;                                                                   // plank seams
        x.fillStyle = paper(Math.min(1.03, k)); x.fillRect(i, y, 1, 1);
      }
      x.fillStyle = paper(0.9);                       // a quiet frame
      x.fillRect(0, 0, 16, 1); x.fillRect(0, 15, 16, 1); x.fillRect(0, 0, 1, 16); x.fillRect(15, 0, 1, 16);
      // The G, one pigment per square.
      let n = 0;
      if (g) for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) if (G[r][c] === '#') { x.fillStyle = PIGMENTS[n++ % PIGMENTS.length]; x.fillRect(6 + c, 5 + r, 1, 1); }
    });
  }
  const inside = px(16, 16, (x) => { for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) { x.fillStyle = paper((0.84 + rnd() * 0.04) * (y % 4 === 3 ? 0.95 : 1)); x.fillRect(i, y, 1, 1); } });

  // ---------- Scene ----------
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 1, 400);
  camera.position.set(0, 36, 60); camera.lookAt(0, 3, 0);
  scene.add(new T.AmbientLight(0xffffff, 1.25));
  const key = new T.DirectionalLight(0xffffff, 1.9); key.position.set(30, 50, 40); scene.add(key);
  const rim = new T.DirectionalLight(0xffe9cc, 0.8); rim.position.set(-40, 20, -30); scene.add(rim);

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

  // ---------- The pieces inside ----------
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

  // Torso (base 16,16; outer +16 rows) and hood (hat layer 32,0). No arms: just the bodies, folded into the crate.
  const torsoOf = (img) => part(img, 16, 16, 8, 4, 12, [0, 16]);
  // Bottoms: both legs (right leg base 0,16 / outer 0,32; left leg base 16,48 / outer 0,48), side by side.
  function pantsOf(img) {
    const g = new T.Group();
    const r = part(img, 0, 16, 4, 4, 12, [0, 16]); r.position.x = -2; g.add(r);
    const l = part(img, 16, 48, 4, 4, 12, [-16, 0]); l.position.x = 2; g.add(l);
    return g;
  }
  const ITEMS = [
    { load: () => locked('aim-baby-hoodie-naples-paynes'), pos: [0.5, 7.0, 0.8], rot: [-0.12, 0.15, -0.14] },
    { load: () => locked('aim-chore-viridian-cobalt'), pos: [-3.6, 5.2, -2.8], rot: [-0.25, -0.35, 0.32] },
    { load: () => locked('aim-inside-out-alizarin-manganese'), pos: [3.8, 4.2, 3.2], rot: [0.32, 0.4, -0.42] },
    { load: () => locked('aim-baby-cozyknit-viridian-cobalt'), pos: [-4.2, 4.4, 3.6], rot: [0.38, -0.5, 0.42] },
    { load: () => locked('aim-trench-naples-paynes'), pos: [4.4, 5.6, -3.2], rot: [-0.3, 0.6, -0.38] },
    { bottom: true, load: () => locked('aim-jean-painter'), pos: [-9.7, 3.2, 0.5], rot: [0, -Math.PI / 2, 0.06] },          // over the left wall
    { bottom: true, load: () => locked('aim-jeajean-agate-springsteen'), pos: [9.7, 3.6, -0.5], rot: [0, Math.PI / 2, -0.06] }, // over the right wall
    { bottom: true, load: () => locked('aim-baby-tights-alizarin-manganese'), pos: [3.2, 8.6, -3.6], rot: [-0.5, 0.45, -0.45] }, // poking out the back
  ];
  for (const it of ITEMS) {
    it.ready = it.load().then((img) => {
      it.img = img;
      const t = it.bottom ? pantsOf(img) : torsoOf(img); t.position.set(...it.pos); t.rotation.set(...it.rot); goodie.add(t);
      return img;
    }).catch(() => null);
  }

  // ---------- Size, drag to turn, open ----------
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < 0.9 ? 78 : 62;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  let rotY = -0.55, vel = 0, drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: rotY }; canvas.setPointerCapture(e.pointerId); const h = document.getElementById('hint'); if (h) h.style.opacity = 0; });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; const nr = drag.r + (e.clientX - drag.x) * 0.01; vel = nr - rotY; rotY = nr; });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  canvas.closest('figure').classList.add('has3d');   // the 3D crate replaces the flat drawing

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag) { vel *= 0.92; rotY += vel; if (!reduce && Math.abs(vel) < 0.002) rotY += dt * 0.18; }
    root.rotation.y = rotY;
    const t = now / 1000;
    if (!reduce) hinge.rotation.x = -(lidOpen + Math.sin(t * 2.2) * 0.04);   // the lid breathes
    goodie.position.y = reduce ? 0 : Math.sin(t * 1.6) * 0.25;
    root.position.y = reduce ? 0 : Math.sin(t * 0.9) * 0.6;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
