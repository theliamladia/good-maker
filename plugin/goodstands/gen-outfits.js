// Builds src/main/resources/outfits.yml from the site's catalogue (js/outfits.js and the
// shoes in js/app.js). Run from the repo root: node plugin/goodstands/gen-outfits.js
const fs = require('fs');
const w = {};
new Function('window', fs.readFileSync('js/outfits.js', 'utf8'))(w);
const app = fs.readFileSync('js/app.js', 'utf8');
const shoeSrc = app.slice(app.indexOf('const SHOE_KINDS = ['), app.indexOf('].map((k) => ({ ...k, colors: k.colors.map(([id, color, swatch])') + 1).replace('const SHOE_KINDS = ', '');
const SHOES = new Function(`return ${shoeSrc}`)();
const hexes = (s) => (Array.isArray(s) ? s : s ? [s] : []).map((h) => h.toLowerCase());
const q = (s) => JSON.stringify(String(s));
const out = ['# GOOD® outfits for GoodStands. Generated from good.leems.me (gen-outfits.js): do not edit by hand.', 'tops:'];
for (const k of w.OUTFITS) for (const c of k.colors || [k]) out.push(`  ${c.id}: { name: ${q(k.name)}, color: ${q(c.color || '')}, swatch: [${hexes(c.swatch).map(q).join(', ')}] }`);
out.push('bottoms:');
for (const k of w.PANTS) for (const c of k.colors || [k]) {
  const shoes = Object.keys(c.shoes || k.shoes || {});
  out.push(`  ${c.id}: { name: ${q(k.name)}, color: ${q(c.color || '')}, swatch: [${hexes(c.swatch).map(q).join(', ')}], shoes: [${shoes.map(q).join(', ')}] }`);
}
out.push('shoes:');
for (const k of SHOES) for (const [id, color, sw] of k.colors) out.push(`  ${id}: { name: ${q(k.name)}, color: ${q(color)}, swatch: [${hexes(sw).map(q).join(', ')}] }`);
fs.writeFileSync('plugin/goodstands/src/main/resources/outfits.yml', out.join('\n') + '\n');
console.log('tops', w.OUTFITS.length, 'bottoms', w.PANTS.length, 'shoe kinds', SHOES.length);
