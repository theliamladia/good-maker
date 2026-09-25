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
// shift hue toward red and gain saturation, highlights shift toward yellow,
// so the result doesn't look like flat grey-darkened skin.
const FACE_STEP = { top: 1, front: 0, outer: -1, back: -1.5, inner: -2, bottom: -3 };
const CAST_SHADOW = -1.5; // skin directly under a sleeve / shorts hem
const LIMB_END = -0.5;    // bottom row of hands and feet

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// step > 0 = lighter, step < 0 = darker. One step ~ 6% lightness.
function shadeTone(tone, step) {
  if (step === 0) return tone.slice();
  const [h, s, l] = rgbToHsl(tone);
  if (step < 0) {
    // Shadows: darker, warmer (toward red), a little more saturated.
    return hslToRgb([h - 4 * -step, clamp01(s + 0.04 * -step), clamp01(l - 0.06 * -step)]);
  }
  // Highlights: lighter, toward yellow, slightly less saturated.
  return hslToRgb([h + 3 * step, clamp01(s - 0.03 * step), clamp01(l + 0.05 * step)]);
}

// Head base (0,0)-(32,16) and hat overlay (32,0)-(64,16).
const HEAD_RECT = [0, 0, 64, 16];

function idx(x, y) { return (y * SIZE + x) * 4; }

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

// Most common opaque colour across the face, cheeks (head sides) and chin
// (head bottom). Colours are bucketed so slight shading noise counts as one tone.
const TONE_SAMPLE_RECTS = [
  [8, 8, 8, 8],   // front
  [0, 8, 8, 8],   // right side
  [16, 8, 8, 8],  // left side
  [16, 0, 8, 8],  // bottom (chin/neck)
];

function sampleSkinTone(skin) {
  skin = to64(skin);
  const buckets = new Map();
  for (const [x0, y0, w, h] of TONE_SAMPLE_RECTS) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const i = idx(x, y);
        if (skin.data[i + 3] < 200) continue;
        const r = skin.data[i], g = skin.data[i + 1], b = skin.data[i + 2];
        const key = `${r >> 4},${g >> 4},${b >> 4}`;
        const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
        e.n++; e.r += r; e.g += g; e.b += b;
        buckets.set(key, e);
      }
    }
  }
  let best = null;
  for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
  if (!best) return [224, 172, 140];
  return [Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n)];
}

// Builds the new skin: user's head + skin-toned body under the outfit.
function mergeSkin(userSkin, outfit, tone, slim) {
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

  return out;
}

const SkinLib = { sampleSkinTone, mergeSkin, bodyParts, shadeTone };
if (typeof module !== 'undefined') module.exports = SkinLib;
else window.SkinLib = SkinLib;
