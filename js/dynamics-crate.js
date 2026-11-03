// DYNAMICS® I (/dynamics): the GOOD® CRATE Nº003 in 3D. A hard-shell carry-on in CDG™ grey
// (16×16 pixel faces, moulded ribs, an AMS™ stripe round the middle, a LAX™ luggage tag with a
// GOOD® BLUE square, a handle on the lid, four wheels), lid lifted, the crate's pieces folded
// inside. Their textures come scrambled from /api/outfit and are decoded straight to pixels.
// Drag to turn. window.DynCrate.open() plays the opening (shake, lid back, the pieces rise),
// .reset() closes it again; js/dynamics-open.js drives both.
(() => {
  const canvas = document.getElementById('crate3d');
  if (!canvas || !window.THREE) return;
  const T = window.THREE;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Pixel textures ----------
  const tex = (c) => { const t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.colorSpace = T.SRGBColorSpace; return t; };
  const px = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); return c; };
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);   // the same shell every visit
  const hex = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;
  const cdg = (k) => hex(0x8f * k, 0x8b * k, 0x85 * k);
  const AMS = '#ffd200', LAX = '#f1f0ea', BLUE = '#0000ff';

  function shell({ stripe = true, tag = false, top = false } = {}) {
    return px(16, 16, (x) => {
      for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
        let k = 0.97 + rnd() * 0.03;
        if (!top && i % 5 === 3) k *= 0.86;                    // the moulded ribs
        if (top && (i === 3 || i === 12)) k *= 0.9;
        x.fillStyle = cdg(k); x.fillRect(i, y, 1, 1);
      }
      x.fillStyle = cdg(0.62);                                 // the frame
      x.fillRect(0, 0, 16, 1); x.fillRect(0, 15, 16, 1); x.fillRect(0, 0, 1, 16); x.fillRect(15, 0, 1, 16);
      if (stripe) { x.fillStyle = AMS; x.fillRect(1, 6, 14, 2); x.fillStyle = '#d9b300'; x.fillRect(1, 7, 14, 1); }
      if (tag) { x.fillStyle = LAX; x.fillRect(10, 9, 4, 4); x.fillStyle = BLUE; x.fillRect(11, 10, 2, 2); }
    });
  }
  const inside = px(16, 16, (x) => { for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) { x.fillStyle = cdg((0.52 + rnd() * 0.04) * (i % 5 === 3 ? 0.9 : 1)); x.fillRect(i, y, 1, 1); } });   // the lining

  // ---------- Scene ----------
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 1, 400);
  camera.position.set(0, 36, 60); camera.lookAt(0, 3, 0);
  scene.add(new T.AmbientLight(0xffffff, 1.3));
  const key = new T.DirectionalLight(0xffffff, 2); key.position.set(30, 50, 40); scene.add(key);
  const rim = new T.DirectionalLight(0x9aa6ff, 1); rim.position.set(-40, 20, -30); scene.add(rim);

  const root = new T.Group(); scene.add(root);
  const mat = (c, extra = {}) => new T.MeshLambertMaterial({ map: tex(c), ...extra });
  const solid = (c) => new T.MeshLambertMaterial({ color: c });

  // The crate: an open box, 16 units a side, walls 1 thick.
  const crate = new T.Group(); root.add(crate);
  const front = shell({ tag: true }), side = shell(), floor = shell({ stripe: false });
  const wall = (w, h, d, x, y, z, outer) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), [mat(outer), mat(outer), mat(inside), mat(floor), mat(outer), mat(outer)]);
    m.position.set(x, y, z); crate.add(m); return m;
  };
  wall(16, 16, 1, 0, 0, 7.5, front);
  wall(16, 16, 1, 0, 0, -7.5, side);
  wall(1, 16, 14, 7.5, 0, 0, side);
  wall(1, 16, 14, -7.5, 0, 0, side);
  wall(14, 1, 14, 0, -7.5, 0, floor);
  for (const [w, h, x, z, ry] of [[14, 15, 0, 6.99, Math.PI], [14, 15, 0, -6.99, 0], [14, 15, 6.99, 0, -Math.PI / 2], [14, 15, -6.99, 0, Math.PI / 2]]) {
    const p = new T.Mesh(new T.PlaneGeometry(w, h), mat(inside)); p.position.set(x, 0.5, z); p.rotation.y = ry; crate.add(p);
  }
  for (const [x, z] of [[-6.5, 6.5], [6.5, 6.5], [-6.5, -6.5], [6.5, -6.5]]) {   // the wheels
    const w = new T.Mesh(new T.BoxGeometry(2, 2, 2), solid(0x111214)); w.position.set(x, -9, z); crate.add(w);
  }

  // The lid, hinged at the back edge, with the handle on top.
  const hinge = new T.Group(); hinge.position.set(0, 8, -8); crate.add(hinge);
  const lid = new T.Group(); lid.position.set(0, 0.8, 8.3); hinge.add(lid);
  lid.add(new T.Mesh(new T.BoxGeometry(16.6, 1.6, 16.6), [mat(side), mat(side), mat(shell({ stripe: false, top: true })), mat(inside), mat(side), mat(side)]));
  for (const [x, y, w, h] of [[-3, 1.6, 1, 1.6], [3, 1.6, 1, 1.6], [0, 2.6, 7, 0.9]]) {
    const b = new T.Mesh(new T.BoxGeometry(w, h, 1.4), solid(0x55585e)); b.position.set(x, y, 0); lid.add(b);
  }
  const lidOpen = 1.05; hinge.rotation.x = -lidOpen;

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
    { load: () => locked('c3-lounge-hoodie-lhr-classic'), pos: [0.5, 7.0, 0.8], rot: [-0.12, 0.15, -0.14] },
    { load: () => locked('c3-flight-jacket-jet-classic'), pos: [-3.6, 5.2, -2.8], rot: [-0.25, -0.35, 0.32] },
    { load: () => locked('c3-hangar-hoodie-contrail-classic'), pos: [3.8, 4.2, 3.2], rot: [0.32, 0.4, -0.42] },
    { load: () => locked('c3-transit-tee-dxb-classic'), pos: [-4.2, 4.4, 3.6], rot: [0.38, -0.5, 0.42] },
    { load: () => locked('c3-parka-cdg-classic'), pos: [4.4, 5.6, -3.2], rot: [-0.3, 0.6, -0.38] },
    { bottom: true, load: () => locked('c3-lounge-pant-jfk'), pos: [-9.7, 3.2, 0.5], rot: [0, -Math.PI / 2, 0.06] },          // over the left wall
    { bottom: true, load: () => locked('c3-tech-jogger-good-blue'), pos: [9.7, 3.6, -0.5], rot: [0, Math.PI / 2, -0.06] },    // over the right wall
    { bottom: true, load: () => locked('c3-flight-cargo-slate'), pos: [3.2, 8.6, -3.6], rot: [-0.5, 0.45, -0.45] },            // poking out the back
  ];
  for (const it of ITEMS) {
    it.load().then((img) => {
      const t = it.bottom ? pantsOf(img) : torsoOf(img); t.position.set(...it.pos); t.rotation.set(...it.rot); goodie.add(t);
    }).catch(() => {});
  }

  // ---------- Size, drag to turn, open ----------
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < 0.9 ? 80 : 64;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();
  if (window.ResizeObserver) new ResizeObserver(size).observe(canvas);

  let rotY = -0.55, vel = 0, drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: rotY }; canvas.setPointerCapture(e.pointerId); const h = document.getElementById('crateHint'); if (h) h.style.opacity = 0; });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; const nr = drag.r + (e.clientX - drag.x) * 0.01; vel = nr - rotY; rotY = nr; });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  // The opening: the case shakes, the lid swings back, the pieces lift out. 1.4 s.
  let opening = 0, closing = 0, rise = 0;
  window.DynCrate = {
    open() { opening = performance.now(); closing = 0; },
    reset() { if (opening) { closing = performance.now(); opening = 0; } },
    duration: reduce ? 0 : 1400,
  };

  // Only draw while it's on screen.
  let seen = true;
  if (window.IntersectionObserver) new IntersectionObserver((es) => { seen = es.some((e) => e.isIntersecting); }).observe(canvas);
  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!seen && !opening) return;
    if (!drag) { vel *= 0.92; rotY += vel; if (!reduce && Math.abs(vel) < 0.002) rotY += dt * 0.18; }
    root.rotation.y = rotY;
    const t = now / 1000;
    if (opening) {
      const p = reduce ? 1 : Math.min(1, (now - opening) / 1400), e = 1 - (1 - p) ** 3;
      crate.rotation.z = p < 0.35 && !reduce ? Math.sin(now / 22) * 0.04 * (1 - p / 0.35) : 0;
      hinge.rotation.x = -(lidOpen + e * 0.75); rise = e * 7;
    } else if (closing) {
      const p = reduce ? 1 : Math.min(1, (now - closing) / 600);
      hinge.rotation.x = -(lidOpen + (1 - p) * 0.75); rise = (1 - p) * 7; crate.rotation.z = 0;
      if (p >= 1) closing = 0;
    } else if (!reduce) hinge.rotation.x = -(lidOpen + Math.sin(t * 2.2) * 0.04);   // the lid breathes
    goodie.position.y = rise + (reduce ? 0 : Math.sin(t * 1.6) * 0.25);
    root.position.y = reduce ? 0 : Math.sin(t * 0.9) * 0.6;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();
