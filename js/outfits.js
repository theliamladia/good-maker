// The catalogue is organised by kind (one card each) and colour (picked
// under the cards). Each colour has one 64x64 PNG per body type, per sleeve:
// bodies = short-sleeve set, long = long-sleeve set; either may be left out,
// and within a set a body may be left out. Options a colour doesn't have are
// hidden from the Body / Sleeve controls while it's selected.
// Leave body areas transparent where skin should show; the head area is ignored.
// classic = 4px (Steve) arms, slim = 3px (Alex) arms.
// swatch = the colour dot shown in the colour picker. Twin colourways (two
// colours, e.g. Pepsi, GOOD® BLUE/COTTON) use two colours: the dot is split 50/50.
// Brand rules: GOOD is always written GOOD®, colourway names included;
// colourway names are written in ALL CAPS.
// locked: true = preview only (served scrambled by /api/outfit, no download).
// notice = card shown next to the 3D preview while selected ({ tag, title, free? }).
// Shirts: the legs of these files are ignored and replaced by the chosen pants
// (window.PANTS below). pants (optional) = pants colour id picked by default
// with this shirt, until the user chooses pants themselves.
window.OUTFITS = [
  {
    id: 'shirt',
    name: 'SHIRT®',
    colors: [
      {
        id: 'shirt-denim',
        color: 'COTTON/DENIM',
        swatch: ['#ffffff', '#57b3ea'],
        bodies: { classic: 'outfits/good-jean-classic.png', slim: 'outfits/good-jean-slim.png' },
        long: { classic: 'outfits/good-jean-long-classic.png', slim: 'outfits/good-jean-long-slim.png' },
      },
      {
        id: 'shirt-blaue',
        color: 'BLAUE/COTTON',
        swatch: ['#2468ff', '#ffffff'],
        bodies: { classic: 'outfits/good-jean-blaue-powder-classic.png', slim: 'outfits/good-jean-blaue-powder-slim.png' },
        long: { classic: 'outfits/good-jean-blaue-powder-long-classic.png', slim: 'outfits/good-jean-blaue-powder-long-slim.png' },
      },
    ],
  },
  {
    id: 'smiley',
    name: 'SMILEY®',
    colors: [
      {
        id: 'smiley-pumpkin-neon',
        color: 'PUMPKIN/NEON',
        swatch: ['#fda327', '#b5ff61'],
        long: {
          classic: 'outfits/smiley-hoodie-pumpkin-neon-long-classic.png',
          slim: 'outfits/smiley-hoodie-pumpkin-neon-long-slim.png',
        },
      },
      {
        id: 'smiley-good-blue',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        long: { classic: 'outfits/smiley-good-blue-long-classic.png', slim: 'outfits/smiley-good-blue-long-slim.png' },
      },
    ],
  },
  {
    id: 'goodie',
    name: 'GOODIE®',
    colors: [
      {
        id: 'goodie-pepsi',
        color: 'PEPSI',
        swatch: ['#3730fe', '#ff141d'],
        long: { classic: 'outfits/goodie-pepsi-long-classic.png', slim: 'outfits/goodie-pepsi-long-slim.png' },
      },
      {
        id: 'goodie-good-blue',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        long: { classic: 'outfits/goodie-good-blue-long-classic.png', slim: 'outfits/goodie-good-blue-long-slim.png' },
      },
      {
        id: 'goodie-oxblood-goldenrod',
        color: 'OXBLOOD/GOLDENROD',
        swatch: ['#713a40', '#e3a828'],
        long: {
          classic: 'outfits/goodie-oxblood-goldenrod-long-classic.png',
          slim: 'outfits/goodie-oxblood-goldenrod-long-slim.png',
        },
      },
      {
        // Archived: preview only. PNGs aren't in this repo; /api/outfit serves
        // them scrambled from Vercel environment variables.
        id: 'goodie-im-sowwy',
        color: "I'M SOWWY",
        swatch: ['#f7cac9', '#92a8d1'],
        locked: true,
        notice: { tag: 'ARCHIVE', title: 'ARCHIVE ONLY - THIS HOODIE IS NO LONGER FOR SALE' },
        long: {
          classic: 'api/outfit?id=goodie-im-sowwy-classic',
          slim: 'api/outfit?id=goodie-im-sowwy-slim',
        },
      },
    ],
  },
  {
    id: 'runway',
    name: 'RUNWAY®',
    // Password-locked looks. Nothing about them is in this repo: the password
    // and the look PNGs live in Vercel environment variables and are only
    // sent by /api/runway after a correct password (see api/runway.js).
    runway: true,
  },
];

// Pants: legs (both layers) plus anything on the torso that belongs to the
// pants (waistband, boxers). Shared by Classic and Slim.
// The pants files are drawn in one light denim; each wash below (but the first) recolours
// the denim (SkinLib.washPants) to its colour, lightest to darkest.
// shoes = one file per shoe colour (picked with the Shoe control); a kind
// with a single src has no shoe choice.
// The first colour of the first kind is the default.
const WASHES = [
  { id: 'springsteen', color: 'SPRINGSTEEN®', swatch: '#37baf7' },    // the files' own denim, not recoloured
  { id: 'roadworn', color: 'ROADWORN®', wash: '#6285b0' },            // slightly darker
  { id: 'favorite-jeans', color: 'FAVORITE JEANS®', wash: '#86a6c4' }, // less indigo, more worn
  { id: 'the-jean', color: 'THE JEAN®', wash: '#3d5886' },            // neutral indigo
  { id: 'patent', color: 'PATENT®', wash: '#283b62' },                // darker
  { id: 'selvedge', color: 'SELVEDGE®', wash: '#161d3a' },            // raw / selvedge indigo
];
const washes = (kind) => WASHES.map((w) => ({ swatch: w.wash, ...w, id: `${kind}-${w.id}` }));

window.PANTS = [
  {
    id: 'springsteen',
    name: 'JEAN®',
    shoes: { black: 'outfits/pants/good-jean-black.png', brown: 'outfits/pants/good-jean-brown.png' },
    colors: washes('springsteen'),
  },
  {
    id: 'springsteen-sagging',
    name: 'JEAN® SAGGING',
    src: 'outfits/pants/good-jean-sagging.png',
    colors: washes('springsteen-sagging'),
  },
];
