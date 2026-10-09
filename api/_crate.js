// GOOD® CRATE: what's inside and the odds. Not a route. The roll happens only
// on the server (api/crate.js); the page just shows this table (GET /api/crate).
//   unlock = the THE MAKER id (kind or colour) a serialized copy unlocks.
// Odds are percent of every crate opened. GOLD is a gold roll: it rolls again
// between the three I'M SOWWY pieces (GOLD_ODDS, percent of a gold roll).
const ITEMS = {
  'goodie-im-sowwy':   { name: 'GOODIE®', color: "I'M SOWWY", tier: 'gold', chase: true, unlock: 'goodie-im-sowwy', tex: 'goodie-im-sowwy-classic' },
  'shirt-ii-im-sowwy': { name: 'SHIRT® II', color: "I'M SOWWY", tier: 'gold', unlock: 'shirt-ii-im-sowwy', tex: 'shirt-ii-im-sowwy-classic', hem: true },
  'shirt-im-sowwy':    { name: 'SHIRT® I', color: "I'M SOWWY", tier: 'gold', unlock: 'shirt-im-sowwy', tex: 'shirt-im-sowwy-classic', hem: true },
  'golden-ticket':     { name: 'GOLDEN TICKET', color: '???', tier: 'ticket' },
  'goodie-after-hours': { name: 'GOODIE®', color: 'AFTER HOURS/CHROME', tier: 'rare', unlock: 'goodie-black-chrome', tex: 'goodie-black-chrome-classic' },
  'runway-cross-jean': { name: 'RUNWAY® CROSS JEAN', color: 'UNIQUEⓤ', tier: 'rare', unlock: 'runway-cross-jean', tex: 'runway-cross-jean', bottom: true },
  'runway-destroyed-longsleeve': { name: 'RUNWAY® DESTROYED LONGSLEEVE', color: 'BLAUE/COTTON', tier: 'runway', unlock: 'runway-destroyed-longsleeve', tex: 'runway-destroyed-longsleeve-classic' },
  'shirt-og':          { name: 'SHIRT® OG', color: 'VINTAGE COTTON/DENIM', tier: 'runway', unlock: 'shirt-og', tex: 'shirt-og-classic' },
  'runway-allover-g':  { name: 'RUNWAY® ILLUSTRATIVE PRINT ALLOVER G', color: 'COTTON/GLACIER', tier: 'runway', unlock: 'runway-allover-g', tex: 'runway-allover-g-classic' },
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
module.exports = { ITEMS, ODDS, GOLD_ODDS, PRICE, REFUND, table };
