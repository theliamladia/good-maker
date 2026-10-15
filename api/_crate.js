// GOOD® CRATE: what's inside and the odds. Not a route. The roll happens only
// on the server (api/crate.js); the page just shows this table (GET /api/crate).
//   unlock = the THE MAKER id (kind or colour) a serialized copy unlocks.
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
// Keys are THE MAKER colour ids; owning a serialized copy unlocks that colour. pct = percent of every crate (sums to 100).
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

module.exports = { ITEMS, ODDS, GOLD_ODDS, PRICE, REFUND, table, ITEMS2, ODDS2, table2 };
