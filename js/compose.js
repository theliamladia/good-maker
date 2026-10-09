// A saved look, drawn flat: the look (catalogue ids, like the address bar) put
// on a skin and shown as a 16×32 front view (head, torso, arms, legs; outer
// layer over base). Used by the account page's WARDROBE. Needs js/skin.js and
// js/outfits.js. Locked pieces (only saved by accounts that own them) are
// decoded from /api/outfit's scrambled data straight to pixels.
window.GoodCompose = (() => {
  const catalogue = (kinds) => kinds.flatMap((k) => (k.colors || [k]).map((c) => ({
    baseUnderHoles: k.baseUnderHoles, hat: k.hat, shoes: k.shoes, boxers: k.boxers, src: k.src, cropped: k.cropped, noTuck: k.noTuck, locked: k.locked, ...c, name: k.name,
  })));
  const TOPS = catalogue(window.OUTFITS), BOTTOMS = catalogue(window.PANTS);
  const cache = {};
  const loadImage = (src) => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = src; });
  const pixels = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height); };
  const load = async (src) => (cache[src] ||= pixels(await loadImage(src)));
  const loadLocked = async (src) => {
    if (cache[src]) return cache[src];
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) throw new Error('unavailable');
    const { k, d } = await res.json();
    const key = Uint8Array.from(atob(k), (c) => c.charCodeAt(0));
    const bytes = Uint8Array.from(atob(d), (c, i) => c.charCodeAt(0) ^ key[i % key.length]);
    const bmp = await createImageBitmap(new Blob([bytes]));
    const data = pixels(bmp); bmp.close();
    return (cache[src] = data);
  };
  const sleeves = (o) => ['short', 'long'].filter((k) => (k === 'long' ? o.long : o.bodies));
  const EMPTY = { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) };

  async function compose(user, L) {
    const o = TOPS.find((t) => t.id === L.top) || null;
    const p = BOTTOMS.find((b) => b.id === L.bottom) || null;
    if (!o && !p) throw new Error('unavailable');
    const detected = SkinLib.detectSlim(user) ? 'slim' : 'classic';
    let outfit = EMPTY, slim = detected === 'slim';
    if (o) {
      const sleeve = sleeves(o).includes(L.sleeve) ? L.sleeve : sleeves(o)[0];
      const set = sleeve === 'long' ? o.long : o.bodies;
      const body = set[L.body] ? L.body : set[detected] ? detected : Object.keys(set)[0];
      slim = body === 'slim';
      outfit = await (o.locked ? loadLocked(set[body]) : load(set[body]));
      if (o.baseUnderHoles) outfit = SkinLib.baseUnderHoles(outfit);
    }
    if (p) {
      const shoes = Object.keys(p.shoes || {});
      const shoe = shoes.includes(L.shoe) ? L.shoe : shoes[0];
      let pants = await load(p.shoes ? p.shoes[shoe] : p.src);
      if (p.boxers && L.boxer === 'tartan') pants = SkinLib.tartanBoxers(pants);
      pants = SkinLib.washPants(pants, p.wash);
      outfit = SkinLib.combineOutfit(outfit, pants, L.tuck !== 'out' || (o && o.cropped) || p.noTuck);
    }
    const tone = SkinLib.sampleSkinTone(user);
    const merged = SkinLib.mergeSkin(user, outfit, tone, slim, slim ? SkinLib.estimateHairRows(user, tone) : 0, null, 'keep', false);
    if (o && o.hat) for (let y = 0; y < 16; y++) { const i = (y * 64 + 32) * 4; merged.data.set(outfit.data.subarray(i, i + 32 * 4), i); }
    return { merged, slim, top: o, bottom: p };
  }
  function front(merged, slim) {
    const tex = document.createElement('canvas'); tex.width = tex.height = 64;
    tex.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(merged.data), 64, 64), 0, 0);
    const c = document.createElement('canvas'); c.width = 16; c.height = 32;
    const ctx = c.getContext('2d'); const a = slim ? 3 : 4;
    for (const [x, y, w, h, dx, dy] of [
      [8, 8, 8, 8, 4, 0], [40, 8, 8, 8, 4, 0], [20, 20, 8, 12, 4, 8], [20, 36, 8, 12, 4, 8],
      [44, 20, a, 12, 4 - a, 8], [44, 36, a, 12, 4 - a, 8], [36, 52, a, 12, 12, 8], [52, 52, a, 12, 12, 8],
      [4, 20, 4, 12, 4, 20], [4, 36, 4, 12, 4, 20], [20, 52, 4, 12, 8, 20], [4, 52, 4, 12, 8, 20],
    ]) ctx.drawImage(tex, x, y, w, h, dx, dy, w, h);
    return c;
  }
  const label = (piece) => (piece ? `${piece.name}${piece.color ? ' ' + piece.color : ''}` : '');
  return { compose, front, load, label };
})();
