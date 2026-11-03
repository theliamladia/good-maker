// GOOD® CRATE: what's inside and the odds. Not a route. The roll happens only
// on the server (api/crate.js); the page just shows this table (GET /api/crate).
//   unlock = the MAKER® id (kind or colour) a serialized copy unlocks.
// Odds are percent of every crate opened. GOLD is a gold roll: it rolls again
// between the three I'M SOWWY pieces (GOLD_ODDS, percent of a gold roll).
const ITEMS = {
  'goodie-im-sowwy':   { name: 'GOODIE®', color: "I'M SOWWY", tier: 'gold', chase: true, unlock: 'goodie-im-sowwy', tex: 'goodie-im-sowwy-classic' },
  'shirt-ii-im-sowwy': { name: 'SHIRT® II', color: "I'M SOWWY", tier: 'gold', unlock: 'shirt-ii-im-sowwy', tex: 'shirt-ii-im-sowwy-classic', hem: true },
  'shirt-im-sowwy':    { name: 'SHIRT® I', color: "I'M SOWWY", tier: 'gold', unlock: 'shirt-im-sowwy', tex: 'shirt-im-sowwy-classic', hem: true },
  'golden-ticket':     { name: 'GOLDEN TICKET', color: '(?) SECRET', tier: 'ticket' },
  'goodie-after-hours': { name: 'GOODIE®', color: 'AFTER HOURS/CHROME', tier: 'rare', unlock: 'goodie-black-chrome', tex: 'goodie-black-chrome-classic' },
  'runway-cross-jean': { name: 'RUNWAY® CROSS JEAN', color: 'UNIQUEⓤ', tier: 'rare', unlock: 'runway-cross-jean', tex: 'runway-cross-jean', bottom: true },
  'runway-destroyed-longsleeve': { name: 'RUNWAY® DESTROYED LONGSLEEVE', color: 'BLAUE/COTTON', tier: 'runway', unlock: 'runway-destroyed-longsleeve', tex: 'runway-destroyed-longsleeve-classic' },
  'shirt-og':          { name: 'SHIRT® OG', color: 'VINTAGE COTTON/DENIM', tier: 'runway', unlock: 'shirt-og', tex: 'shirt-og-classic' },
  'runway-allover-g':  { name: 'RUNWAY® ALLOVER', color: 'COTTON/GLACIER', tier: 'runway', unlock: 'runway-allover-g', tex: 'runway-allover-g-classic' },
  'jean-mosaic':       { name: 'JEAN® MOSAIC', color: 'SPRINGSTEEN/GOOD® BLUE', tier: 'runway', unlock: 'jean-mosaic', tex: 'jean-mosaic', bottom: true },
  'runway-marshmallow-mosaic': { name: 'RUNWAY® MARSHMALLOW MOSAIC', color: 'MARSHMALLOW/BLAUE', tier: 'runway', unlock: 'runway-marshmallow-mosaic', tex: 'runway-marshmallow-mosaic', bottom: true },
};
const ODDS = [                     // percent, sums to 100
  ['GOLD', 4],
  ['golden-ticket', 0.5],
  ['goodie-after-hours', 8],
  ['runway-cross-jean', 9.5],
  ['runway-destroyed-longsleeve', 13],
  ['shirt-og', 16],
  ['runway-allover-g', 16],
  ['jean-mosaic', 16.5],
  ['runway-marshmallow-mosaic', 16.5],
];
const GOLD_ODDS = [['goodie-im-sowwy', 20], ['shirt-ii-im-sowwy', 40], ['shirt-im-sowwy', 40]];
const PRICE = 5;
const REFUND = 2;

// Each item's chance out of a whole crate, for the page.
function table() {
  const gold = ODDS.find(([k]) => k === 'GOLD')[1];
  const pct = Object.fromEntries(ODDS.filter(([k]) => k !== 'GOLD'));
  for (const [k, p] of GOLD_ODDS) pct[k] = (gold * p) / 100;
  return Object.entries(ITEMS).map(([id, it]) => ({ id, ...it, pct: Math.round(pct[id] * 100) / 100 }));
}
// GOOD® CRATE Nº002 · ART® IN MOTION (/inmotion; GET /api/crate?crate=2, POST { action: 'open', crate: 2 }).
// Keys are MAKER® colour ids; owning a serialized copy unlocks that colour. pct = percent of every crate (sums to 100).
// tex = the preview-only texture (api/_locked/aim-*.enc); bottom / accessory = which section it shows in.
const ITEMS2 = {
  'c2-chore-naples-paynes': { name: "CHORE®", color: "NAPLES YELLOW/PAYNE'S GREY", tier: 'core', pct: 3.3, tex: 'aim-chore-naples-paynes', unlock: 'c2-chore-naples-paynes' },
  'c2-chore-viridian-cobalt': { name: "CHORE®", color: "VIRIDIAN/COBALT VIOLET", tier: 'core', pct: 3.3, tex: 'aim-chore-viridian-cobalt', unlock: 'c2-chore-viridian-cobalt' },
  'c2-chore-alizarin-manganese': { name: "CHORE®", color: "ALIZARIN/MANGANESE BLUE", tier: 'core', pct: 3.3, tex: 'aim-chore-alizarin-manganese', unlock: 'c2-chore-alizarin-manganese' },
  'c2-trench-naples-paynes': { name: "TRENCH®", color: "NAPLES YELLOW/PAYNE'S GREY", tier: 'core', pct: 3.3, tex: 'aim-trench-naples-paynes', unlock: 'c2-trench-naples-paynes' },
  'c2-trench-viridian-cobalt': { name: "TRENCH®", color: "VIRIDIAN/COBALT VIOLET", tier: 'core', pct: 3.3, tex: 'aim-trench-viridian-cobalt', unlock: 'c2-trench-viridian-cobalt' },
  'c2-trench-alizarin-manganese': { name: "TRENCH®", color: "ALIZARIN/MANGANESE BLUE", tier: 'core', pct: 3.3, tex: 'aim-trench-alizarin-manganese', unlock: 'c2-trench-alizarin-manganese' },
  'c2-inside-out-naples-paynes': { name: "INSIDE OUT®", color: "NAPLES YELLOW/PAYNE'S GREY", tier: 'core', pct: 3.3, tex: 'aim-inside-out-naples-paynes', unlock: 'c2-inside-out-naples-paynes' },
  'c2-inside-out-viridian-cobalt': { name: "INSIDE OUT®", color: "VIRIDIAN/COBALT VIOLET", tier: 'core', pct: 3.3, tex: 'aim-inside-out-viridian-cobalt', unlock: 'c2-inside-out-viridian-cobalt' },
  'c2-inside-out-alizarin-manganese': { name: "INSIDE OUT®", color: "ALIZARIN/MANGANESE BLUE", tier: 'core', pct: 3.3, tex: 'aim-inside-out-alizarin-manganese', unlock: 'c2-inside-out-alizarin-manganese' },
  'c2-baby-hoodie-naples-paynes': { name: "BABY® BOYFRIEND HOODIE", color: "NAPLES YELLOW/PAYNE'S GREY", tier: 'core', pct: 3.3, tex: 'aim-baby-hoodie-naples-paynes', unlock: 'c2-baby-hoodie-naples-paynes' },
  'c2-baby-hoodie-viridian-cobalt': { name: "BABY® BOYFRIEND HOODIE", color: "VIRIDIAN/COBALT VIOLET", tier: 'core', pct: 3.3, tex: 'aim-baby-hoodie-viridian-cobalt', unlock: 'c2-baby-hoodie-viridian-cobalt' },
  'c2-baby-hoodie-alizarin-manganese': { name: "BABY® BOYFRIEND HOODIE", color: "ALIZARIN/MANGANESE BLUE", tier: 'core', pct: 3.3, tex: 'aim-baby-hoodie-alizarin-manganese', unlock: 'c2-baby-hoodie-alizarin-manganese' },
  'c2-baby-cozyknit-naples-paynes': { name: "BABY® COZYKNIT", color: "NAPLES YELLOW/PAYNE'S GREY", tier: 'core', pct: 3.3, tex: 'aim-baby-cozyknit-naples-paynes', unlock: 'c2-baby-cozyknit-naples-paynes' },
  'c2-baby-cozyknit-viridian-cobalt': { name: "BABY® COZYKNIT", color: "VIRIDIAN/COBALT VIOLET", tier: 'core', pct: 3.3, tex: 'aim-baby-cozyknit-viridian-cobalt', unlock: 'c2-baby-cozyknit-viridian-cobalt' },
  'c2-baby-cozyknit-alizarin-manganese': { name: "BABY® COZYKNIT", color: "ALIZARIN/MANGANESE BLUE", tier: 'core', pct: 3.3, tex: 'aim-baby-cozyknit-alizarin-manganese', unlock: 'c2-baby-cozyknit-alizarin-manganese' },
  'c2-scarf-splatter': { name: "SCARF®", color: "SPLATTER", tier: 'rare', pct: 1.5, tex: 'aim-scarf-splatter', accessory: true, unlock: 'c2-scarf-splatter' },
  'c2-scarf-im-sowwy': { name: "SCARF®", color: "I'M SOWWY", tier: 'chase', pct: 1, tex: 'aim-scarf-im-sowwy', accessory: true, unlock: 'c2-scarf-im-sowwy' },
  'c2-splatter-springsteen': { name: "JEAN® SPLATTER", color: "SPRINGSTEEN", tier: 'core', pct: 4, tex: 'aim-splatter-springsteen', bottom: true, unlock: 'c2-splatter-springsteen' },
  'c2-splatter-the-jean': { name: "JEAN® SPLATTER", color: "THE JEAN", tier: 'core', pct: 4, tex: 'aim-splatter-the-jean', bottom: true, unlock: 'c2-splatter-the-jean' },
  'c2-splatter-selvedge': { name: "JEAN® SPLATTER", color: "SELVEDGE", tier: 'core', pct: 4, tex: 'aim-splatter-selvedge', bottom: true, unlock: 'c2-splatter-selvedge' },
  'c2-jean-ice': { name: "JEAN® ICE", color: "ICE", tier: 'core', pct: 4, tex: 'aim-jean-ice', bottom: true, unlock: 'c2-jean-ice' },
  'c2-jean-bleached': { name: "JEAN® BLEACHED", color: "BLEACHED", tier: 'core', pct: 4, tex: 'aim-jean-bleached', bottom: true, unlock: 'c2-jean-bleached' },
  'c2-jeajean-springsteen-the-jean': { name: "JEAJEAN®", color: "SPRINGSTEEN/THE JEAN", tier: 'core', pct: 4, tex: 'aim-jeajean-springsteen-the-jean', bottom: true, unlock: 'c2-jeajean-springsteen-the-jean' },
  'c2-jeajean-ice-selvedge': { name: "JEAJEAN®", color: "ICE/SELVEDGE", tier: 'core', pct: 4, tex: 'aim-jeajean-ice-selvedge', bottom: true, unlock: 'c2-jeajean-ice-selvedge' },
  'c2-jeajean-springsteen-agate': { name: "JEAJEAN®", color: "SPRINGSTEEN/AGATE", tier: 'core', pct: 4, tex: 'aim-jeajean-springsteen-agate', bottom: true, unlock: 'c2-jeajean-springsteen-agate' },
  'c2-jeajean-agate-springsteen': { name: "JEAJEAN®", color: "AGATE/SPRINGSTEEN", tier: 'rare', pct: 3, tex: 'aim-jeajean-agate-springsteen', bottom: true, unlock: 'c2-jeajean-agate-springsteen' },
  'c2-jean-painter': { name: "JEAN® PAINTER SPLATTER", color: "ART® IN MOTION", tier: 'chase', pct: 1, tex: 'aim-jean-painter', bottom: true, chase: true, unlock: 'c2-jean-painter' },
  'c2-baby-tights-naples-paynes': { name: "BABY® TIGHTS", color: "NAPLES YELLOW/PAYNE'S GREY", tier: 'core', pct: 4, tex: 'aim-baby-tights-naples-paynes', bottom: true, unlock: 'c2-baby-tights-naples-paynes' },
  'c2-baby-tights-viridian-cobalt': { name: "BABY® TIGHTS", color: "VIRIDIAN/COBALT VIOLET", tier: 'core', pct: 4, tex: 'aim-baby-tights-viridian-cobalt', bottom: true, unlock: 'c2-baby-tights-viridian-cobalt' },
  'c2-baby-tights-alizarin-manganese': { name: "BABY® TIGHTS", color: "ALIZARIN/MANGANESE BLUE", tier: 'core', pct: 4, tex: 'aim-baby-tights-alizarin-manganese', bottom: true, unlock: 'c2-baby-tights-alizarin-manganese' },
};
const table2 = () => Object.entries(ITEMS2).map(([id, it]) => ({ id, ...it }));
const ODDS2 = Object.entries(ITEMS2).map(([id, it]) => [id, it.pct]);

// GOOD® CRATE Nº003 · DYNAMICS® I (/dynamics; GET /api/crate?crate=3, POST { action: 'open', crate: 3 }).
// TARMAC® essentials 48%, DYNAMICS® 36%, TARMAC® avant-garde 13% (shared evenly in each tier), and two
// chases at 1.5% each. A chase is a set: one pull unlocks both pieces (unlock is a list).
const ITEMS3 = {
  "c3-lounge-hoodie-lhr": { name: "LOUNGE HOODIE®", color: "LHR", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-lounge-hoodie-lhr-classic', unlock: 'c3-lounge-hoodie-lhr' },
  "c3-lounge-hoodie-cdg": { name: "LOUNGE HOODIE®", color: "CDG", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-lounge-hoodie-cdg-classic', unlock: 'c3-lounge-hoodie-cdg' },
  "c3-lounge-hoodie-lax": { name: "LOUNGE HOODIE®", color: "LAX", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-lounge-hoodie-lax-classic', unlock: 'c3-lounge-hoodie-lax' },
  "c3-lounge-hoodie-dxb": { name: "LOUNGE HOODIE®", color: "DXB", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-lounge-hoodie-dxb-classic', unlock: 'c3-lounge-hoodie-dxb' },
  "c3-transit-tee-lhr": { name: "TRANSIT TEE", color: "LHR", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-transit-tee-lhr-classic', unlock: 'c3-transit-tee-lhr' },
  "c3-transit-tee-cdg": { name: "TRANSIT TEE", color: "CDG", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-transit-tee-cdg-classic', unlock: 'c3-transit-tee-cdg' },
  "c3-transit-tee-lax": { name: "TRANSIT TEE", color: "LAX", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-transit-tee-lax-classic', unlock: 'c3-transit-tee-lax' },
  "c3-transit-tee-dxb": { name: "TRANSIT TEE", color: "DXB", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-transit-tee-dxb-classic', unlock: 'c3-transit-tee-dxb' },
  "c3-pillow-collar-lax": { name: "PILLOW COLLAR® JACKET", color: "LAX", line: 'tarmac', tier: 'rare', pct: 1.857, tex: 'c3-pillow-collar-lax-classic', unlock: 'c3-pillow-collar-lax' },
  "c3-pillow-collar-lhr": { name: "PILLOW COLLAR® JACKET", color: "LHR", line: 'tarmac', tier: 'rare', pct: 1.857, tex: 'c3-pillow-collar-lhr-classic', unlock: 'c3-pillow-collar-lhr' },
  "c3-parka-cdg": { name: "BOARDING PASS PARKA", color: "CDG/AMS", line: 'tarmac', tier: 'rare', pct: 1.857, tex: 'c3-parka-cdg-classic', unlock: 'c3-parka-cdg' },
  "c3-parka-lhr": { name: "BOARDING PASS PARKA", color: "LHR", line: 'tarmac', tier: 'rare', pct: 1.857, tex: 'c3-parka-lhr-classic', unlock: 'c3-parka-lhr' },
  "c3-safety-card-lax": { name: "SAFETY CARD SHIRT", color: "LAX/LHR", line: 'tarmac', tier: 'rare', pct: 1.857, tex: 'c3-safety-card-lax-classic', unlock: 'c3-safety-card-lax' },
  "c3-flight-jacket-jet": { name: "FLIGHT JACKET®", color: "JET/CONTRAIL", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-flight-jacket-jet-classic', unlock: 'c3-flight-jacket-jet' },
  "c3-crew-tee-contrail": { name: "CREW TEE", color: "CONTRAIL/GOOD® BLUE", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-crew-tee-contrail-classic', unlock: 'c3-crew-tee-contrail' },
  "c3-pilot-shirt-slate": { name: "PILOT SHIRT®", color: "SLATE/CONTRAIL", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-pilot-shirt-slate-classic', unlock: 'c3-pilot-shirt-slate' },
  "c3-hangar-hoodie-contrail": { name: "HANGAR HOODIE®", color: "CONTRAIL/GOOD® BLUE", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-hangar-hoodie-contrail-classic', unlock: 'c3-hangar-hoodie-contrail' },
  "c3-mock-neck-jet": { name: "MOCK NECK®", color: "JET/CONTRAIL", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-mock-neck-jet-classic', unlock: 'c3-mock-neck-jet' },
  "c3-sports-bra-jet": { name: "SPORTS BRA", color: "JET", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-sports-bra-jet-classic', unlock: 'c3-sports-bra-jet' },
  "c3-sports-bra-contrail": { name: "SPORTS BRA", color: "CONTRAIL", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-sports-bra-contrail-classic', unlock: 'c3-sports-bra-contrail' },
  "c3-sports-bra-slate": { name: "SPORTS BRA", color: "SLATE", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-sports-bra-slate-classic', unlock: 'c3-sports-bra-slate' },
  "c3-lounge-pant-lhr": { name: "LOUNGE PANT", color: "LHR", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-lounge-pant-lhr', bottom: true, unlock: 'c3-lounge-pant-lhr' },
  "c3-lounge-pant-cdg": { name: "LOUNGE PANT", color: "CDG", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-lounge-pant-cdg', bottom: true, unlock: 'c3-lounge-pant-cdg' },
  "c3-lounge-pant-lax": { name: "LOUNGE PANT", color: "LAX", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-lounge-pant-lax', bottom: true, unlock: 'c3-lounge-pant-lax' },
  "c3-lounge-pant-dxb": { name: "LOUNGE PANT", color: "DXB", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-lounge-pant-dxb', bottom: true, unlock: 'c3-lounge-pant-dxb' },
  "c3-carry-on-lhr": { name: "CARRY-ON TROUSER", color: "LHR", line: 'tarmac', tier: 'rare', pct: 1.857, tex: 'c3-carry-on-lhr', bottom: true, unlock: 'c3-carry-on-lhr' },
  "c3-carry-on-dxb": { name: "CARRY-ON TROUSER", color: "DXB", line: 'tarmac', tier: 'rare', pct: 1.857, tex: 'c3-carry-on-dxb', bottom: true, unlock: 'c3-carry-on-dxb' },
  "c3-flight-cargo-slate": { name: "FLIGHT CARGO", color: "SLATE", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-flight-cargo-slate', bottom: true, unlock: 'c3-flight-cargo-slate' },
  "c3-crew-trouser-jet": { name: "CREW TROUSER", color: "JET", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-crew-trouser-jet', bottom: true, unlock: 'c3-crew-trouser-jet' },
  "c3-tech-jogger-jet": { name: "TECH JOGGER", color: "JET/CONTRAIL", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-tech-jogger-jet', bottom: true, unlock: 'c3-tech-jogger-jet' },
  "c3-pilot-short-slate": { name: "PILOT SHORT", color: "SLATE", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-pilot-short-slate', bottom: true, unlock: 'c3-pilot-short-slate' },
  "c3-contrail-wide-contrail": { name: "CONTRAIL WIDE TROUSER", color: "CONTRAIL", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-contrail-wide-contrail', bottom: true, unlock: 'c3-contrail-wide-contrail' },
  "c3-yoga-pant-jet": { name: "YOGA PANT", color: "JET", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-yoga-pant-jet', bottom: true, unlock: 'c3-yoga-pant-jet' },
  "c3-yoga-pant-contrail": { name: "YOGA PANT", color: "CONTRAIL", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-yoga-pant-contrail', bottom: true, unlock: 'c3-yoga-pant-contrail' },
  "c3-yoga-pant-slate": { name: "YOGA PANT", color: "SLATE", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-yoga-pant-slate', bottom: true, unlock: 'c3-yoga-pant-slate' },
  "c3-wide-leg-jet": { name: "WIDE-LEG TROUSER", color: "JET", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-wide-leg-jet', bottom: true, unlock: 'c3-wide-leg-jet' },
  "c3-wide-leg-contrail": { name: "WIDE-LEG TROUSER", color: "CONTRAIL", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-wide-leg-contrail', bottom: true, unlock: 'c3-wide-leg-contrail' },
  "c3-wide-leg-slate": { name: "WIDE-LEG TROUSER", color: "SLATE", line: 'dynamics', tier: 'core', pct: 1.895, tex: 'c3-wide-leg-slate', bottom: true, unlock: 'c3-wide-leg-slate' },
  "c3-eye-mask-lhr": { name: "EYE MASK", color: "LHR", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-eye-mask-lhr', accessory: true, unlock: 'c3-eye-mask-lhr' },
  "c3-eye-mask-jfk": { name: "EYE MASK", color: "JFK", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-eye-mask-jfk', accessory: true, unlock: 'c3-eye-mask-jfk' },
  "c3-travel-pillow-dxb": { name: "TRAVEL PILLOW", color: "DXB", line: 'tarmac', tier: 'core', pct: 3.2, tex: 'c3-travel-pillow-dxb', accessory: true, unlock: 'c3-travel-pillow-dxb' },
  'c3-red-eye-set': { name: 'RED-EYE® LOUNGE SET', color: 'JFK/AMS', line: 'tarmac', tier: 'chase', chase: true, pct: 1.5, tex: 'c3-lounge-hoodie-jfk-classic', unlock: ['c3-lounge-hoodie-jfk', 'c3-lounge-pant-jfk'] },
  'c3-hangar-set': { name: 'HANGAR HOODIE® · TECH JOGGER', color: 'GOOD® BLUE/CONTRAIL', line: 'dynamics', tier: 'chase', chase: true, pct: 1.5, tex: 'c3-hangar-hoodie-good-blue-classic', unlock: ['c3-hangar-hoodie-good-blue', 'c3-tech-jogger-good-blue'] },
};
const table3 = () => Object.entries(ITEMS3).map(([id, it]) => ({ id, ...it }));
const ODDS3 = Object.entries(ITEMS3).map(([id, it]) => [id, it.pct]);

module.exports = { ITEMS, ODDS, GOLD_ODDS, PRICE, REFUND, table, ITEMS2, ODDS2, table2, ITEMS3, ODDS3, table3 };
