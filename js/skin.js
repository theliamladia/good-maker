// Core skin-merging logic. Works on 64x64 RGBA ImageData-like objects
// ({ width, height, data }), so it runs in the browser and in Node tests.

const SIZE = 64;

// Every face of a Minecraft cuboid in UV space, tagged by side.
// (u, v) = top-left of the part's texture block, w/h/d = width/height/depth.
function cuboidFaces(u, v, w, h, d) {
  return {
    top: [u + d, v, w, d],
    bottom: [u + d + w, v, w, d],
    right: [u, v + d, d, h],
    front: [u + d, v + d, w, h],
    left: [u + d + w, v + d, d, h],
    back: [u + d + w + d, v + d, w, h],
  };
}

// Base-layer body parts that get filled with skin tone.
// ov = offset from base UV to that part's overlay (jacket/sleeve/pants) UV.
// inner = which side face points toward the body (shaded darker).
function bodyParts(slim) {
  const arm = slim ? 3 : 4;
  return [
    { name: 'torso', faces: cuboidFaces(16, 16, 8, 12, 4), ov: [0, 16], inner: null },
    { name: 'rightArm', faces: cuboidFaces(40, 16, arm, 12, 4), ov: [0, 16], inner: 'left' },
    { name: 'leftArm', faces: cuboidFaces(32, 48, arm, 12, 4), ov: [16, 0], inner: 'right' },
    { name: 'rightLeg', faces: cuboidFaces(0, 16, 4, 12, 4), ov: [0, 16], inner: 'left' },
    { name: 'leftLeg', faces: cuboidFaces(16, 48, 4, 12, 4), ov: [-16, 0], inner: 'right' },
  ];
}

// --- Shading -------------------------------------------------------------
// Light comes from above and in front. Each face gets a tone step; shadows
// lean warm and highlights lean toward warm white, so the result doesn't
// look like flat grey-darkened skin.
const FACE_STEP = { top: 1, front: 0, outer: -1, back: -1.5, inner: -2, bottom: -3 };
const CAST_SHADOW = -1.5; // skin directly under a sleeve / shorts hem
const LIMB_END = -0.5;    // bottom row of hands and feet

// step > 0 = lighter, step < 0 = darker.
// Shadows multiply the colour down (keeps it natural rather than neon) and
// pull green down a touch more, shifting shade warm toward red/purple.
// Highlights blend toward a warm off-white.
function shadeTone(tone, step) {
  if (step === 0) return tone.slice();
  const [r, g, b] = tone;
  if (step < 0) {
    const n = -step;
    const f = 1 - 0.07 * n;
    return [r * f, g * f * (1 - 0.025 * n), b * f * (1 - 0.01 * n)].map((v) => Math.round(Math.max(0, v)));
  }
  const t = 0.1 * step;
  return [r + (255 - r) * t, g + (246 - g) * t, b + (228 - b) * t].map(Math.round);
}

// Head base (0,0)-(32,16) and hat overlay (32,0)-(64,16).
const HEAD_RECT = [0, 0, 64, 16];

function idx(x, y) { return (y * SIZE + x) * 4; }
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function blank() {
  return { width: SIZE, height: SIZE, data: new Uint8ClampedArray(SIZE * SIZE * 4) };
}

// Normalises legacy 64x32 skins to 64x64 (only the head is used, so the
// missing bottom half can stay empty).
function to64(img) {
  if (img.width !== SIZE || (img.height !== SIZE && img.height !== 32)) {
    throw new Error(`Skin must be 64x64 or 64x32 (got ${img.width}x${img.height}).`);
  }
  if (img.height === SIZE) return img;
  const out = blank();
  out.data.set(img.data.subarray(0, SIZE * 32 * 4));
  return out;
}

// Skin tone = the lower-face colour that best matches the hands. Colours that
// also cover the back/sides of the head are usually hair, so they're heavily
// discounted unless the hands confirm them (e.g. furry/creature skins).
// Nearby shades are grouped so a shaded face still counts as one tone.
const TONE_FACE = [[9, 11, 6, 5]];          // lower-middle of the face
const TONE_HANDS = [
  [44, 30, 4, 2], [36, 62, 4, 2],           // bottom rows of arm fronts
  [48, 16, 3, 4], [40, 48, 3, 4],           // arm bottom faces (hands)
];
const TONE_HAIR_REF = [[24, 8, 8, 8], [0, 8, 8, 8], [16, 8, 8, 8]]; // head back + sides

function sampleSkinTone(skin) {
  skin = to64(skin);
  const collect = (rects) => {
    const out = [];
    for (const [x0, y0, w, h] of rects) {
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const i = idx(x, y);
          if (skin.data[i + 3] >= 200) out.push([skin.data[i], skin.data[i + 1], skin.data[i + 2]]);
        }
      }
    }
    return out;
  };
  const face = collect(TONE_FACE);
  const hands = collect(TONE_HANDS);
  const hairRef = collect(TONE_HAIR_REF);
  const near = (list, c, d) => list.filter((p) => dist(p, c) < d).length;

  let best = null, bestScore = 0;
  for (const c of face) {
    const faceN = near(face, c, 30);
    const handN = near(hands, c, 30);
    const hairN = near(hairRef, c, 20);
    const skinLike = c[0] >= c[1] && c[1] >= c[2] * 0.85 ? 1.5 : 1; // warm hue bonus, never required
    const hairLike = handN === 0 && hairN >= 3 ? 0.2 : 1;
    const score = (faceN + (handN ? handN * 2 + 6 : 0)) * skinLike * hairLike;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best ? best.slice() : [224, 172, 140];
}

// Builds the new skin: user's head + skin-toned body under the outfit.
function mergeSkin(userSkin, outfit, tone, slim, hairRows = 0) {
  outfit = to64(outfit);
  const out = blank();
  const opaque = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE && outfit.data[idx(x, y) + 3] > 0;

  // 1. Shaded skin tone on every base-layer body face.
  for (const part of bodyParts(slim)) {
    for (const [side, [x0, y0, w, h]] of Object.entries(part.faces)) {
      const isSide = side !== 'top' && side !== 'bottom';
      let faceStep;
      if (side === 'left' || side === 'right') {
        faceStep = side === part.inner ? FACE_STEP.inner : FACE_STEP.outer;
      } else {
        faceStep = FACE_STEP[side];
      }
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          let step = faceStep;
          if (isSide && y > y0) {
            // Pixel directly above is clothing (base or overlay) -> cast shadow.
            const [ox, oy] = part.ov;
            if (opaque(x, y - 1) || opaque(x + ox, y - 1 + oy)) step += CAST_SHADOW;
          }
          if (isSide && part.name !== 'torso' && y === y0 + h - 1) step += LIMB_END;
          const c = shadeTone(tone, step);
          const i = idx(x, y);
          out.data[i] = c[0]; out.data[i + 1] = c[1]; out.data[i + 2] = c[2]; out.data[i + 3] = 255;
        }
      }
    }
  }

  // 2. Outfit on top (alpha-composited so semi-transparent pixels blend).
  for (let i = 0; i < out.data.length; i += 4) {
    const a = outfit.data[i + 3] / 255;
    if (a === 0) continue;
    const da = out.data[i + 3] / 255;
    const oa = a + da * (1 - a);
    for (let c = 0; c < 3; c++) {
      out.data[i + c] = Math.round((outfit.data[i + c] * a + out.data[i + c] * da * (1 - a)) / oa);
    }
    out.data[i + 3] = Math.round(oa * 255);
  }

  // 3. User's head + hat layer, replacing whatever is there.
  if (!userSkin) return out;
  userSkin = to64(userSkin);
  const [hx, hy, hw, hh] = HEAD_RECT;
  for (let y = hy; y < hy + hh; y++) {
    for (let x = hx; x < hx + hw; x++) {
      const i = idx(x, y);
      for (let c = 0; c < 4; c++) out.data[i + c] = userSkin.data[i + c];
    }
  }

  // 4. Long hair that hangs onto the torso, placed on the jacket layer so it
  //    sits over the new outfit.
  for (const { x, y, rgba } of extractHair(userSkin, tone, hairRows)) {
    const i = idx(x, y);
    for (let c = 0; c < 4; c++) out.data[i + c] = rgba[c];
  }

  return out;
}

// --- Hair ----------------------------------------------------------------
// Torso side faces (base layer UVs); the jacket overlay is 16px below each.
const TORSO = { right: [16, 20, 4, 12], front: [20, 20, 8, 12], left: [28, 20, 4, 12], back: [32, 20, 8, 12] };
const JACKET_DY = 16;


// Colours on the back and sides of the head (base + hat) - where hair almost
// always is - minus anything close to the skin tone.
function hairPalette(skin, tone) {
  const counts = new Map();
  const rects = [[24, 8, 8, 8], [0, 8, 8, 8], [16, 8, 8, 8], [56, 8, 8, 8], [32, 8, 8, 8], [48, 8, 8, 8]];
  for (const [x0, y0, w, h] of rects) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const i = idx(x, y);
        if (skin.data[i + 3] < 128) continue;
        const rgb = [skin.data[i], skin.data[i + 1], skin.data[i + 2]];
        if (dist(rgb, tone) < 40) continue;
        const key = rgb.join();
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }
  return [...counts].filter(([, n]) => n >= 2).map(([k]) => k.split(',').map(Number));
}

// The pixel the viewer actually sees at a torso position: jacket if present, else base.
function visibleTorsoPixel(skin, x, y) {
  const o = idx(x, y + JACKET_DY);
  if (skin.data[o + 3] > 0) return [...skin.data.slice(o, o + 4)];
  const b = idx(x, y);
  if (skin.data[b + 3] > 0) return [...skin.data.slice(b, b + 4)];
  return null;
}

// Colours covering a big share of the torso are the old outfit, not hair.
function clothingColours(skin) {
  const counts = new Map();
  let total = 0;
  for (const [x0, y0, w, h] of Object.values(TORSO)) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const px = visibleTorsoPixel(skin, x, y);
        if (!px) continue;
        total++;
        const key = px.slice(0, 3).map((v) => v >> 4).join();
        const e = counts.get(key) || { n: 0, c: px };
        e.n++;
        counts.set(key, e);
      }
    }
  }
  return [...counts.values()].filter((e) => e.n / total >= 0.2).map((e) => e.c);
}

// Returns jacket-layer pixels to paint: [{ x, y, rgba }].
// Hair is found by flooding down from the neckline through hair-coloured
// pixels, limited to the top `rows` rows. On the back, anything drawn on the
// jacket layer counts too (hair there often uses shades the head doesn't).
function extractHair(skin, tone, rows) {
  if (!skin || rows <= 0 || skin.height !== SIZE) return [];
  const clothes = clothingColours(skin);
  const palette = hairPalette(skin, tone).filter((p) => !clothes.some((c) => dist(c, p) < 20));
  const notClothes = (rgb) => !clothes.some((c) => dist(c, rgb) < 20);
  const isHair = (rgb) => dist(rgb, tone) >= 40 && notClothes(rgb) && palette.some((p) => dist(p, rgb) < 28);
  const found = [];

  for (const [side, [x0, y0, w]] of Object.entries(TORSO)) {
    const seen = new Set();
    const queue = [];
    const ok = (x, y) => {
      if (x < x0 || x >= x0 + w || y < y0 || y >= y0 + rows) return null;
      const px = visibleTorsoPixel(skin, x, y);
      if (!px) return null;
      const onJacket = skin.data[idx(x, y + JACKET_DY) + 3] > 0;
      return isHair(px) || (side === 'back' && onJacket && notClothes(px)) ? px : null;
    };
    for (let x = x0; x < x0 + w; x++) queue.push([x, y0]);
    while (queue.length) {
      const [x, y] = queue.pop();
      const key = x + ',' + y;
      if (seen.has(key)) continue;
      seen.add(key);
      const px = ok(x, y);
      if (!px) continue;
      found.push({ x, y: y + JACKET_DY, rgba: px });
      queue.push([x + 1, y], [x - 1, y], [x, y + 1]);
    }
  }
  return found;
}

// Guesses hair length (0 / 4 / 8 / 12 rows) from how far hair reaches down the torso.
function estimateHairRows(skin, tone) {
  const hair = extractHair(skin, tone, 12);
  if (hair.length < 4) return 0;
  const perRow = new Array(12).fill(0);
  for (const p of hair) perRow[p.y - JACKET_DY - 20]++;
  let reach = 0;
  for (let r = 0; r < 12; r++) if (perRow[r] >= 2) reach = r + 1;
  return reach <= 1 ? 0 : reach <= 4 ? 4 : reach <= 8 ? 8 : 12;
}

// Slim (Alex) skins leave the 4th arm column transparent: the right arm's
// front-right strip at x=54..55, y=20..31 is unused on 3px arms.
function detectSlim(skin) {
  if (skin.height !== SIZE) return false;
  for (let y = 20; y < 32; y++) {
    for (let x = 54; x < 56; x++) if (skin.data[idx(x, y) + 3] !== 0) return false;
  }
  return true;
}

const SkinLib = { sampleSkinTone, mergeSkin, bodyParts, shadeTone, detectSlim, estimateHairRows };
if (typeof module !== 'undefined') module.exports = SkinLib;
else window.SkinLib = SkinLib;
