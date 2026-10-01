// The catalogue is organised by kind (one card each) and colour (picked
// under the cards). Each colour has one 64x64 PNG per body type, per sleeve:
// bodies = short-sleeve set, long = long-sleeve set; either may be left out,
// and within a set a body may be left out. Options a colour doesn't have are
// hidden from the Body / Sleeve controls while it's selected.
// Leave body areas transparent where skin should show; the head area is ignored
// (except for kinds with hat: true, whose hat layer replaces the player's).
// classic = 4px (Steve) arms, slim = 3px (Alex) arms.
// swatch = the colour dot shown in the colour picker. Twin colourways (two
// colours, e.g. Pepsi, GOOD® BLUE/COTTON) use two colours: the dot is split 50/50.
// New colours: also add them to js/colors.js (the COLORS® page).
// Brand rules: GOOD is always written GOOD®, colourway names included;
// colour names (e.g. the washes) are trademarked ™, not registered ®;
// colourway names are written in ALL CAPS.
// locked: true = preview only (served scrambled by /api/outfit, no download).
// line = which side of the GOOD® / BABY® toggle a kind shows under: 'good' (the
// default), 'baby' or 'both'. Shirts only: every pants kind shows under both,
// and switching lines keeps the pants and shoe you picked.
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
    // The tee pulled up over the head: the hat layer is the shirt (neck hole
    // round the face), the body is cropped at the chest. hat: true = this
    // outfit's hat layer replaces the player's.
    id: 'croppie',
    name: 'CROPPIE®',
    hat: true,
    colors: [
      {
        id: 'croppie-dust-pink',
        color: 'DUST PINK/TOMATO VINE',
        swatch: ['#c98aa0', '#3f7a55'],
        bodies: { classic: 'outfits/croppie-dust-pink-classic.png', slim: 'outfits/croppie-dust-pink-slim.png' },
      },
      {
        id: 'croppie-good-blue',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        bodies: { classic: 'outfits/croppie-good-blue-classic.png', slim: 'outfits/croppie-good-blue-slim.png' },
      },
    ],
  },
  {
    // A CROPPIE® worn over a long-sleeve tee: the CROPPIE® (hat layer + outer
    // chest) over the tee (base layer torso and full sleeves). Two logos.
    id: 'doubbie',
    name: 'DOUBBIE®',
    hat: true,
    colors: [
      {
        id: 'doubbie-good-blue',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        long: { classic: 'outfits/doubbie-good-blue-classic.png', slim: 'outfits/doubbie-good-blue-slim.png' },
      },
      {
        id: 'doubbie-dust-pink',
        color: 'DUST PINK/TOMATO VINE',
        swatch: ['#c98aa0', '#3f7a55'],
        long: { classic: 'outfits/doubbie-dust-pink-classic.png', slim: 'outfits/doubbie-dust-pink-slim.png' },
      },
      {
        id: 'doubbie-double-blue',
        color: 'GOOD® BLUE/GOOD® BLUE',
        swatch: ['#0000ff', '#0000ff'],
        long: { classic: 'outfits/doubbie-double-blue-classic.png', slim: 'outfits/doubbie-double-blue-slim.png' },
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
      {
        id: 'smiley-safety-good-blue',
        color: 'SAFETY/GOOD® BLUE',
        swatch: ['#ff5a1f', '#0000ff'],
        long: {
          classic: 'outfits/smiley-safety-good-blue-long-classic.png',
          slim: 'outfits/smiley-safety-good-blue-long-slim.png',
        },
      },
    ],
  },
  {
    id: 'goodie',
    name: 'GOODIE®',
    // The base layer only colours the G cut out of the hoodie (SkinLib.baseUnderHoles).
    baseUnderHoles: true,
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
        id: 'goodie-sky-cotton',
        color: 'SKY/COTTON',
        swatch: ['#8fd0ff', '#ffffff'],
        long: { classic: 'outfits/goodie-sky-cotton-long-classic.png', slim: 'outfits/goodie-sky-cotton-long-slim.png' },
      },
      {
        // Preview only: served scrambled by /api/outfit from environment variables.
        id: 'goodie-black-chrome',
        color: 'AFTER HOURS/CHROME',
        swatch: ['#14141b', '#c9ced6'],
        locked: true,
        long: {
          classic: 'api/outfit?id=goodie-black-chrome-classic',
          slim: 'api/outfit?id=goodie-black-chrome-slim',
        },
      },
      {
        // Archived: preview only. PNGs aren't in this repo; /api/outfit serves
        // them scrambled from Vercel environment variables.
        id: 'goodie-im-sowwy',
        color: "I'M SOWWY",
        swatch: ['#f7cac9', '#92a8d1'],
        locked: true,
        long: {
          classic: 'api/outfit?id=goodie-im-sowwy-classic',
          slim: 'api/outfit?id=goodie-im-sowwy-slim',
        },
      },
    ],
  },
  {
    // All-over knit of the GOODIE® G: whole Gs only, zig-zagged on the body and
    // spiralling round the sleeves so none touch.
    id: 'gknit',
    name: 'G-KNIT®',
    colors: [
      {
        id: 'gknit-vanilla-bean-good-blue',
        color: 'VANILLA BEAN/GOOD® BLUE',
        swatch: ['#ece4d2', '#0000ff'],
        long: { classic: 'outfits/gknit-vanilla-bean-good-blue-long-classic.png', slim: 'outfits/gknit-vanilla-bean-good-blue-long-slim.png' },
      },
      {
        id: 'gknit-good-blue-cotton',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        long: { classic: 'outfits/gknit-good-blue-cotton-long-classic.png', slim: 'outfits/gknit-good-blue-cotton-long-slim.png' },
      },
      {
        id: 'gknit-oxblood-goldenrod',
        color: 'OXBLOOD/GOLDENROD',
        swatch: ['#713a40', '#e3a828'],
        long: { classic: 'outfits/gknit-oxblood-goldenrod-long-classic.png', slim: 'outfits/gknit-oxblood-goldenrod-long-slim.png' },
      },
      {
        id: 'gknit-dust-pink-tomato-vine',
        color: 'DUST PINK/TOMATO VINE',
        swatch: ['#c98aa0', '#3f7a55'],
        long: { classic: 'outfits/gknit-dust-pink-tomato-vine-long-classic.png', slim: 'outfits/gknit-dust-pink-tomato-vine-long-slim.png' },
      },
    ],
  },
  {
    id: 'collar',
    name: 'COLLAR®',
    colors: [
      {
        id: 'collar-good-blue',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        long: { classic: 'outfits/collar-good-blue-long-classic.png', slim: 'outfits/collar-good-blue-long-slim.png' },
      },
      {
        id: 'collar-cotton-denim',
        color: 'COTTON/DENIM',
        swatch: ['#ffffff', '#57b3ea'],
        long: { classic: 'outfits/collar-cotton-denim-long-classic.png', slim: 'outfits/collar-cotton-denim-long-slim.png' },
      },
    ],
  },
  {
    // Workwear jacket over a COTTON tee: open collar, patch pockets, G stitched on the chest and back in the button colour.
    id: 'chore',
    name: 'CHORE COAT®',
    colors: [
      {
        id: 'chore-duck-canvas',
        color: 'DUCK CANVAS/COCOA',
        swatch: ['#b98f55', '#5a3a2a'],
        long: { classic: 'outfits/chore-duck-canvas-long-classic.png', slim: 'outfits/chore-duck-canvas-long-slim.png' },
      },
      {
        id: 'chore-black-rinse',
        color: 'INKWELL/GOLDENROD',
        swatch: ['#26272d', '#e3a828'],
        long: { classic: 'outfits/chore-black-rinse-long-classic.png', slim: 'outfits/chore-black-rinse-long-slim.png' },
      },
      {
        id: 'chore-ecru-twill',
        color: 'ECRU TWILL/COCOA',
        swatch: ['#ddd2b8', '#5a3a2a'],
        long: { classic: 'outfits/chore-ecru-twill-long-classic.png', slim: 'outfits/chore-ecru-twill-long-slim.png' },
      },
      {
        id: 'chore-fern',
        color: 'FERN/GOLDENROD',
        swatch: ['#4f6b45', '#e3a828'],
        long: { classic: 'outfits/chore-fern-long-classic.png', slim: 'outfits/chore-fern-long-slim.png' },
      },
    ],
  },
  {
    // Neon rain slicker, smooth and glossy, hood up (hat: true), G on the right sleeve and the back.
    id: 'slicker',
    name: 'SLICKER®',
    hat: true,
    colors: [
      {
        id: 'slicker-volt',
        color: 'VOLT/AFTER HOURS',
        swatch: ['#c8ff2e', '#14141b'],
        long: { classic: 'outfits/slicker-volt-long-classic.png', slim: 'outfits/slicker-volt-long-slim.png' },
      },
      {
        id: 'slicker-hot-flamingo',
        color: 'HOT FLAMINGO/AFTER HOURS',
        swatch: ['#ff4fb3', '#14141b'],
        long: { classic: 'outfits/slicker-hot-flamingo-long-classic.png', slim: 'outfits/slicker-hot-flamingo-long-slim.png' },
      },
      {
        id: 'slicker-electric-tangerine',
        color: 'ELECTRIC TANGERINE/AFTER HOURS',
        swatch: ['#ff7a1a', '#14141b'],
        long: { classic: 'outfits/slicker-electric-tangerine-long-classic.png', slim: 'outfits/slicker-electric-tangerine-long-slim.png' },
      },
      {
        id: 'slicker-ultraviolet',
        color: 'ULTRAVIOLET/COTTON',
        swatch: ['#8a3dff', '#ffffff'],
        long: { classic: 'outfits/slicker-ultraviolet-long-classic.png', slim: 'outfits/slicker-ultraviolet-long-slim.png' },
      },
    ],
  },
  {
    // Zip pile fleece: contrast zip, collar, chest pocket, hem and cuffs; G on the right sleeve.
    id: 'fleece',
    name: 'FLEECE®',
    colors: [
      {
        id: 'fleece-oatmilk-cocoa',
        color: 'OATMILK/COCOA',
        swatch: ['#e7dcc8', '#5a3a2a'],
        long: { classic: 'outfits/fleece-oatmilk-cocoa-long-classic.png', slim: 'outfits/fleece-oatmilk-cocoa-long-slim.png' },
      },
      {
        id: 'fleece-pebble-terracotta',
        color: 'PEBBLE/TERRACOTTA',
        swatch: ['#a9a59c', '#c7623f'],
        long: { classic: 'outfits/fleece-pebble-terracotta-long-classic.png', slim: 'outfits/fleece-pebble-terracotta-long-slim.png' },
      },
      {
        id: 'fleece-sage-forest',
        color: 'SAGE/FOREST',
        swatch: ['#a7b59a', '#2f4a33'],
        long: { classic: 'outfits/fleece-sage-forest-long-classic.png', slim: 'outfits/fleece-sage-forest-long-slim.png' },
      },
      {
        id: 'fleece-berry-peony',
        color: 'BERRY/PEONY',
        swatch: ['#8a2a4b', '#f2a7c0'],
        long: { classic: 'outfits/fleece-berry-peony-long-classic.png', slim: 'outfits/fleece-berry-peony-long-slim.png' },
      },
    ],
  },
  {
    // Quilted puffer cut at the ribs over a COTTON tee; GOOD® BLUE G on the chest.
    id: 'puffer-cropped',
    name: 'CROPPED PUFFER®',
    line: 'baby',
    colors: [
      {
        id: 'puffer-cropped-matcha',
        color: 'MATCHA/GOOD® BLUE',
        swatch: ['#9bb77a', '#0000ff'],
        long: { classic: 'outfits/puffer-cropped-matcha-long-classic.png', slim: 'outfits/puffer-cropped-matcha-long-slim.png' },
      },
      {
        id: 'puffer-cropped-lilac-haze',
        color: 'LILAC HAZE/GOOD® BLUE',
        swatch: ['#b9a3d9', '#0000ff'],
        long: { classic: 'outfits/puffer-cropped-lilac-haze-long-classic.png', slim: 'outfits/puffer-cropped-lilac-haze-long-slim.png' },
      },
      {
        id: 'puffer-cropped-butterscotch',
        color: 'BUTTERSCOTCH/GOOD® BLUE',
        swatch: ['#e0a24a', '#0000ff'],
        long: { classic: 'outfits/puffer-cropped-butterscotch-long-classic.png', slim: 'outfits/puffer-cropped-butterscotch-long-slim.png' },
      },
      {
        id: 'puffer-cropped-glacier',
        color: 'GLACIER/GOOD® BLUE',
        swatch: ['#bcd9e6', '#0000ff'],
        long: { classic: 'outfits/puffer-cropped-glacier-long-classic.png', slim: 'outfits/puffer-cropped-glacier-long-slim.png' },
      },
    ],
  },
  {
    // Cropped cardigan, pearl buttons, a G knitted into the outside of the left sleeve.
    id: 'cardie',
    line: 'baby',
    name: 'CARDIE®',
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'cardie-strawberry-milk',
        color: 'STRAWBERRY MILK/TOMATO VINE',
        swatch: ['#f6c6d4', '#3f7a55'],
        long: { classic: 'outfits/cardie-strawberry-milk-long-classic.png', slim: 'outfits/cardie-strawberry-milk-long-slim.png' },
        pants: 'watermelons-tomato-vine',
      },
      {
        id: 'cardie-creamsicle',
        color: 'CREAMSICLE/TOMATO VINE',
        swatch: ['#fcc9a2', '#3f7a55'],
        long: { classic: 'outfits/cardie-creamsicle-long-classic.png', slim: 'outfits/cardie-creamsicle-long-slim.png' },
        pants: 'watermelons-tomato-vine',
      },
      {
        id: 'cardie-marshmallow',
        color: 'MARSHMALLOW/TOMATO VINE',
        swatch: ['#f7f2ea', '#3f7a55'],
        long: { classic: 'outfits/cardie-marshmallow-long-classic.png', slim: 'outfits/cardie-marshmallow-long-slim.png' },
        pants: 'watermelons-tomato-vine',
      },
      {
        id: 'cardie-tweetie',
        color: 'TWEETIE/TOMATO VINE',
        swatch: ['#ffd92e', '#3f7a55'],
        long: { classic: 'outfits/cardie-tweetie-long-classic.png', slim: 'outfits/cardie-tweetie-long-slim.png' },
        pants: 'watermelons-tomato-vine',
      },
      {
        id: 'cardie-sky',
        color: 'SKY/TOMATO VINE',
        swatch: ['#8fd0ff', '#3f7a55'],
        long: { classic: 'outfits/cardie-sky-long-classic.png', slim: 'outfits/cardie-sky-long-slim.png' },
        pants: 'watermelons-tomato-vine',
      },
    ],
  },
  {
    // Fitted tee cropped above the waist; the midriff shows.
    id: 'baby-tee',
    line: 'baby',
    name: 'BABY TEE®',
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'baby-tee-good-blue-cotton',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        bodies: { classic: 'outfits/baby-tee-good-blue-cotton-classic.png', slim: 'outfits/baby-tee-good-blue-cotton-slim.png' },
        long: { classic: 'outfits/baby-tee-good-blue-cotton-long-classic.png', slim: 'outfits/baby-tee-good-blue-cotton-long-slim.png' },
      },
      {
        id: 'baby-tee-cotton-good-blue',
        color: 'COTTON/GOOD® BLUE',
        swatch: ['#ffffff', '#0000ff'],
        bodies: { classic: 'outfits/baby-tee-cotton-good-blue-classic.png', slim: 'outfits/baby-tee-cotton-good-blue-slim.png' },
        long: { classic: 'outfits/baby-tee-cotton-good-blue-long-classic.png', slim: 'outfits/baby-tee-cotton-good-blue-long-slim.png' },
      },
      {
        id: 'baby-tee-sky-cotton',
        color: 'SKY/COTTON',
        swatch: ['#8fd0ff', '#ffffff'],
        bodies: { classic: 'outfits/baby-tee-sky-cotton-classic.png', slim: 'outfits/baby-tee-sky-cotton-slim.png' },
        long: { classic: 'outfits/baby-tee-sky-cotton-long-classic.png', slim: 'outfits/baby-tee-sky-cotton-long-slim.png' },
      },
      {
        id: 'baby-tee-dust-pink-tomato-vine',
        color: 'DUST PINK/TOMATO VINE',
        swatch: ['#c98aa0', '#3f7a55'],
        bodies: { classic: 'outfits/baby-tee-dust-pink-tomato-vine-classic.png', slim: 'outfits/baby-tee-dust-pink-tomato-vine-slim.png' },
        long: { classic: 'outfits/baby-tee-dust-pink-tomato-vine-long-classic.png', slim: 'outfits/baby-tee-dust-pink-tomato-vine-long-slim.png' },
      },
    ],
  },
  {
    // Tied at the neck, open back, cropped.
    id: 'halter',
    line: 'baby',
    name: 'HALTER®',
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'halter-sky-cotton',
        color: 'SKY/COTTON',
        swatch: ['#8fd0ff', '#ffffff'],
        bodies: { classic: 'outfits/halter-sky-cotton-classic.png', slim: 'outfits/halter-sky-cotton-slim.png' },
      },
      {
        id: 'halter-good-blue-cotton',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        bodies: { classic: 'outfits/halter-good-blue-cotton-classic.png', slim: 'outfits/halter-good-blue-cotton-slim.png' },
      },
      {
        id: 'halter-neon-good-blue',
        color: 'NEON/GOOD® BLUE',
        swatch: ['#b5ff61', '#0000ff'],
        bodies: { classic: 'outfits/halter-neon-good-blue-classic.png', slim: 'outfits/halter-neon-good-blue-slim.png' },
      },
      {
        id: 'halter-black-chrome',
        color: 'AFTER HOURS/CHROME',
        swatch: ['#14141b', '#c9ced6'],
        bodies: { classic: 'outfits/halter-black-chrome-classic.png', slim: 'outfits/halter-black-chrome-slim.png' },
      },
    ],
  },
  {
    // Strapless, boned, laced up the front in the second colour.
    id: 'corset',
    line: 'baby',
    name: 'CORSET®',
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'corset-good-blue-cotton',
        color: 'GOOD® BLUE/COTTON',
        swatch: ['#0000ff', '#ffffff'],
        bodies: { classic: 'outfits/corset-good-blue-cotton-classic.png', slim: 'outfits/corset-good-blue-cotton-slim.png' },
      },
      {
        id: 'corset-black-chrome',
        color: 'AFTER HOURS/CHROME',
        swatch: ['#14141b', '#c9ced6'],
        bodies: { classic: 'outfits/corset-black-chrome-classic.png', slim: 'outfits/corset-black-chrome-slim.png' },
      },
      {
        id: 'corset-oxblood-goldenrod',
        color: 'OXBLOOD/GOLDENROD',
        swatch: ['#713a40', '#e3a828'],
        bodies: { classic: 'outfits/corset-oxblood-goldenrod-classic.png', slim: 'outfits/corset-oxblood-goldenrod-slim.png' },
      },
    ],
  },
];

// Pants: legs (both layers) plus anything on the torso that belongs to the
// pants (waistband, boxers). Shared by Classic and Slim.
// The pants files are drawn in one light denim; each wash below (but the first) recolours
// the denim (SkinLib.washPants) to its colour, lightest to darkest.
// shoes = one file per shoe colour (picked with the Shoe control; it shows
// only the colours a kind has); a kind with a single src has no shoe choice.
// TOBACCO shoe files are the black-shoe files with the shoes (and belt) recoloured;
// SNEAK01 files are the black-shoe files with PLTSWT®'s sneaker (and sock) in place of the shoe;
// on the outer layer the jeans win, the sneaker only fills where they leave gaps.
// The first colour of the first kind is the default.
const WASHES = [
  { id: 'springsteen', color: 'SPRINGSTEEN™', swatch: '#37baf7' },    // the files' own denim, not recoloured
  { id: 'roadworn', color: 'ROADWORN™', wash: '#6285b0' },            // slightly darker
  { id: 'favorite-jeans', color: 'FAVORITE JEANS™', wash: '#86a6c4' }, // less indigo, more worn
  { id: 'the-jean', color: 'THE JEAN™', wash: '#3d5886' },            // neutral indigo
  { id: 'patent', color: 'PATENT™', wash: '#283b62' },                // darker
  { id: 'selvedge', color: 'SELVEDGE™', wash: '#161d3a' },            // raw / selvedge indigo
];
const washes = (kind) => WASHES.map((w) => ({ swatch: w.wash, ...w, id: `${kind}-${w.id}` }));

window.PANTS = [
  {
    id: 'springsteen',
    name: 'JEAN®',
    shoes: {
      black: 'outfits/pants/good-jean-black.png',
      brown: 'outfits/pants/good-jean-brown.png',
      tobacco: 'outfits/pants/good-jean-tobacco.png',
      sneak01: 'outfits/pants/good-jean-sneak01.png',
    },
    colors: washes('springsteen'),
  },
  {
    // Outer layer only at the hem, so the leg kicks out at the bottom.
    id: 'jean-bootcut',
    name: 'JEAN® BOOTCUT',
    shoes: {
      black: 'outfits/pants/good-jean-bootcut-black.png',
      brown: 'outfits/pants/good-jean-bootcut-brown.png',
      tobacco: 'outfits/pants/good-jean-bootcut-tobacco.png',
      sneak01: 'outfits/pants/good-jean-bootcut-sneak01.png',
    },
    colors: washes('jean-bootcut'),
  },
  {
    // Baggy jort: the jean cut above the knee, frayed hem, white crew socks.
    id: 'jort',
    name: 'JORT®',
    shoes: {
      black: 'outfits/pants/good-jort-black.png',
      brown: 'outfits/pants/good-jort-brown.png',
      tobacco: 'outfits/pants/good-jort-tobacco.png',
      sneak01: 'outfits/pants/good-jort-sneak01.png',
    },
    colors: washes('jort'),
  },
  {
    // Pleated sweat: leg and waistband on the body, bunched hem on the outer
    // layer; SNEAK01 (white, GOOD® BLUE sole) is built into the outer layer.
    id: 'pltswt',
    name: 'PLTSWT®',
    shoes: { sneak01: 'outfits/pants/pltswt-heather-grey.png' },
    colors: [{ id: 'pltswt-heather-grey', color: 'HEATHER GREY', swatch: '#9a9ca3' }],
  },
  {
    // Shoes: TOBACCO (the only pair, so no Shoe control).
    id: 'mosaic',
    name: 'MOSAIC®',
    colors: [{ id: 'mosaic-gray-chrome', color: 'SIDEWALK/CHROME', swatch: ['#56565a', '#c9ced6'], src: 'outfits/pants/mosaic-gray-chrome.png' }],
  },
  {
    id: 'springsteen-sagging',
    name: 'JEAN® SAGGING',
    shoes: {
      black: 'outfits/pants/good-jean-sagging.png',
      tobacco: 'outfits/pants/good-jean-sagging-tobacco.png',
      sneak01: 'outfits/pants/good-jean-sagging-sneak01.png',
    },
    boxers: true, // Boxer control: blue (as drawn) or red tartan (SkinLib.tartanBoxers)
    colors: washes('springsteen-sagging'),
  },
  {
    // Pleated midi skirt: pleats on the outer layer of the legs, bare shins, shoes.
    id: 'watermelons',
    name: 'WATERMELONS®',
    noTuck: true, // a skirt: tops always tuck in
    shoes: {
      tobacco: 'outfits/pants/watermelons-tomato-vine-tobacco.png',
      black: 'outfits/pants/watermelons-tomato-vine-black.png',
      brown: 'outfits/pants/watermelons-tomato-vine-brown.png',
      sneak01: 'outfits/pants/watermelons-tomato-vine-sneak01.png',
    },
    colors: [{ id: 'watermelons-tomato-vine', color: 'TOMATO VINE', swatch: '#3f7a55' }],
  },
];
