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
    // AMONG THE TREES® (GOOD® CAPSULE Nº2): COTTON with the new G on the chest in MAPLE LEAF.
    id: 'shirt-ii',
    name: 'SHIRT® II',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    colors: [
      {
        id: 'shirt-cotton-maple-leaf',
        pants: 'cargo-maple-leaf-fatigue',
        color: 'COTTON/MAPLE LEAF',
        swatch: ['#ffffff', '#c2452b'],
        bodies: { classic: 'outfits/good-shirt-cotton-maple-leaf-classic.png', slim: 'outfits/good-shirt-cotton-maple-leaf-slim.png' },
        long: { classic: 'outfits/good-shirt-cotton-maple-leaf-long-classic.png', slim: 'outfits/good-shirt-cotton-maple-leaf-long-slim.png' },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Zip at the neck, the new G under it, contrast cuffs and hem.
    id: 'half-zip',
    name: 'HALF-ZIP®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    line: 'good',
    colors: [
      {
        id: 'half-zip-cinnamon-toast-fern',
        pants: 'cargo-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        long: { classic: 'outfits/att/half-zip-cinnamon-toast-fern-long-classic.png', slim: 'outfits/att/half-zip-cinnamon-toast-fern-long-slim.png' },
      },
      {
        id: 'half-zip-wash-day-trench',
        pants: 'cargo-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        long: { classic: 'outfits/att/half-zip-wash-day-trench-long-classic.png', slim: 'outfits/att/half-zip-wash-day-trench-long-slim.png' },
      },
      {
        id: 'half-zip-maple-leaf-fatigue',
        pants: 'cargo-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        long: { classic: 'outfits/att/half-zip-maple-leaf-fatigue-long-classic.png', slim: 'outfits/att/half-zip-maple-leaf-fatigue-long-slim.png' },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Hooped rugby shirt, COTTON collar and cuffs, the new G in COTTON.
    id: 'rugby',
    name: 'RUGBY®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    line: 'good',
    colors: [
      {
        id: 'rugby-cinnamon-toast-fern',
        pants: 'pleat-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        long: { classic: 'outfits/att/rugby-cinnamon-toast-fern-long-classic.png', slim: 'outfits/att/rugby-cinnamon-toast-fern-long-slim.png' },
      },
      {
        id: 'rugby-wash-day-trench',
        pants: 'pleat-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        long: { classic: 'outfits/att/rugby-wash-day-trench-long-classic.png', slim: 'outfits/att/rugby-wash-day-trench-long-slim.png' },
      },
      {
        id: 'rugby-maple-leaf-fatigue',
        pants: 'pleat-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        long: { classic: 'outfits/att/rugby-maple-leaf-fatigue-long-classic.png', slim: 'outfits/att/rugby-maple-leaf-fatigue-long-slim.png' },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Cardigan over a tee in the other colour, the new G set off on the right front panel.
    id: 'grandpa',
    name: 'GRANDPA®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    line: 'good',
    colors: [
      {
        id: 'grandpa-cinnamon-toast-fern',
        pants: 'cord-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        long: { classic: 'outfits/att/grandpa-cinnamon-toast-fern-long-classic.png', slim: 'outfits/att/grandpa-cinnamon-toast-fern-long-slim.png' },
      },
      {
        id: 'grandpa-wash-day-trench',
        pants: 'cord-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        long: { classic: 'outfits/att/grandpa-wash-day-trench-long-classic.png', slim: 'outfits/att/grandpa-wash-day-trench-long-slim.png' },
      },
      {
        id: 'grandpa-maple-leaf-fatigue',
        pants: 'cord-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        long: { classic: 'outfits/att/grandpa-maple-leaf-fatigue-long-classic.png', slim: 'outfits/att/grandpa-maple-leaf-fatigue-long-slim.png' },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). A knit shrug over a cropped tank; the new G on the tank.
    id: 'shrug',
    name: 'SHRUG®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    line: 'baby',
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'shrug-cinnamon-toast-fern',
        pants: 'knit-midi-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        long: { classic: 'outfits/att/shrug-cinnamon-toast-fern-long-classic.png', slim: 'outfits/att/shrug-cinnamon-toast-fern-long-slim.png' },
      },
      {
        id: 'shrug-wash-day-trench',
        pants: 'knit-midi-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        long: { classic: 'outfits/att/shrug-wash-day-trench-long-classic.png', slim: 'outfits/att/shrug-wash-day-trench-long-slim.png' },
      },
      {
        id: 'shrug-maple-leaf-fatigue',
        pants: 'knit-midi-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        long: { classic: 'outfits/att/shrug-maple-leaf-fatigue-long-classic.png', slim: 'outfits/att/shrug-maple-leaf-fatigue-long-slim.png' },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Cropped varsity jacket, COTTON body, the new G on the chest.
    id: 'varsity',
    name: 'VARSITY®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    line: 'baby',
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'varsity-cinnamon-toast-fern',
        pants: 'kilt-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        long: { classic: 'outfits/att/varsity-cinnamon-toast-fern-long-classic.png', slim: 'outfits/att/varsity-cinnamon-toast-fern-long-slim.png' },
      },
      {
        id: 'varsity-wash-day-trench',
        pants: 'kilt-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        long: { classic: 'outfits/att/varsity-wash-day-trench-long-classic.png', slim: 'outfits/att/varsity-wash-day-trench-long-slim.png' },
      },
      {
        id: 'varsity-maple-leaf-fatigue',
        pants: 'kilt-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        long: { classic: 'outfits/att/varsity-maple-leaf-fatigue-long-classic.png', slim: 'outfits/att/varsity-maple-leaf-fatigue-long-slim.png' },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Cropped wrap top crossing over the front; the new G small on the left.
    id: 'wrap',
    name: 'WRAP®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    line: 'baby',
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'wrap-cinnamon-toast-fern',
        pants: 'maxi-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        long: { classic: 'outfits/att/wrap-cinnamon-toast-fern-long-classic.png', slim: 'outfits/att/wrap-cinnamon-toast-fern-long-slim.png' },
      },
      {
        id: 'wrap-wash-day-trench',
        pants: 'maxi-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        long: { classic: 'outfits/att/wrap-wash-day-trench-long-classic.png', slim: 'outfits/att/wrap-wash-day-trench-long-slim.png' },
      },
      {
        id: 'wrap-maple-leaf-fatigue',
        pants: 'maxi-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        long: { classic: 'outfits/att/wrap-maple-leaf-fatigue-long-classic.png', slim: 'outfits/att/wrap-maple-leaf-fatigue-long-slim.png' },
      },
    ],
  },
  {
    id: 'shirt',
    name: 'SHIRT® I',
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
    name: 'CROPPIE® I',
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
    name: 'DOUBBIE® I',
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
    // The CROPPIE® for BABY®: the tee pulled over the head and cropped at the chest, in BABY® pastels.
    id: 'croppie-baby',
    name: 'BABY CROPPIE®',
    line: 'baby',
    hat: true,
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'croppie-baby-strawberry-milk-tomato-vine',
        color: 'STRAWBERRY MILK/TOMATO VINE',
        swatch: ['#f6c6d4', '#3f7a55'],
        bodies: { classic: 'outfits/croppie-baby-strawberry-milk-tomato-vine-classic.png', slim: 'outfits/croppie-baby-strawberry-milk-tomato-vine-slim.png' },
      },
      {
        id: 'croppie-baby-creamsicle-good-blue',
        color: 'CREAMSICLE/GOOD® BLUE',
        swatch: ['#fcc9a2', '#0000ff'],
        bodies: { classic: 'outfits/croppie-baby-creamsicle-good-blue-classic.png', slim: 'outfits/croppie-baby-creamsicle-good-blue-slim.png' },
      },
      {
        id: 'croppie-baby-lilac-haze-cotton',
        color: 'LILAC HAZE/COTTON',
        swatch: ['#b9a3d9', '#ffffff'],
        bodies: { classic: 'outfits/croppie-baby-lilac-haze-cotton-classic.png', slim: 'outfits/croppie-baby-lilac-haze-cotton-slim.png' },
      },
      {
        id: 'croppie-baby-glacier-good-blue',
        color: 'GLACIER/GOOD® BLUE',
        swatch: ['#bcd9e6', '#0000ff'],
        bodies: { classic: 'outfits/croppie-baby-glacier-good-blue-classic.png', slim: 'outfits/croppie-baby-glacier-good-blue-slim.png' },
      },
    ],
  },
  {
    // A CROPPIE® over a cropped long-sleeve BABY TEE®: two Gs, midriff showing. Colourway = CROPPIE®/tee; each G is in the other colour.
    id: 'doubbie-baby',
    name: 'BABY DOUBBIE®',
    line: 'baby',
    hat: true,
    cropped: true, // ends above the waist: no Tuck control
    colors: [
      {
        id: 'doubbie-baby-strawberry-milk-marshmallow',
        color: 'STRAWBERRY MILK/MARSHMALLOW',
        swatch: ['#f6c6d4', '#f7f2ea'],
        long: { classic: 'outfits/doubbie-baby-strawberry-milk-marshmallow-classic.png', slim: 'outfits/doubbie-baby-strawberry-milk-marshmallow-slim.png' },
      },
      {
        id: 'doubbie-baby-sky-strawberry-milk',
        color: 'SKY/STRAWBERRY MILK',
        swatch: ['#8fd0ff', '#f6c6d4'],
        long: { classic: 'outfits/doubbie-baby-sky-strawberry-milk-classic.png', slim: 'outfits/doubbie-baby-sky-strawberry-milk-slim.png' },
      },
      {
        id: 'doubbie-baby-lilac-haze-glacier',
        color: 'LILAC HAZE/GLACIER',
        swatch: ['#b9a3d9', '#bcd9e6'],
        long: { classic: 'outfits/doubbie-baby-lilac-haze-glacier-classic.png', slim: 'outfits/doubbie-baby-lilac-haze-glacier-slim.png' },
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
// The first colour of the first kind is the default (AMONG THE TREES® first).
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
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Cargo pocket on each outer leg, contrast waistband.
    id: 'cargo',
    name: 'CARGO®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    colors: [
      {
        id: 'cargo-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        shoes: {
          black: 'outfits/pants/att/cargo-cinnamon-toast-fern-black.png',
          brown: 'outfits/pants/att/cargo-cinnamon-toast-fern-brown.png',
          tobacco: 'outfits/pants/att/cargo-cinnamon-toast-fern-tobacco.png',
          sneak01: 'outfits/pants/att/cargo-cinnamon-toast-fern-sneak01.png',
        },
      },
      {
        id: 'cargo-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        shoes: {
          black: 'outfits/pants/att/cargo-wash-day-trench-black.png',
          brown: 'outfits/pants/att/cargo-wash-day-trench-brown.png',
          tobacco: 'outfits/pants/att/cargo-wash-day-trench-tobacco.png',
          sneak01: 'outfits/pants/att/cargo-wash-day-trench-sneak01.png',
        },
      },
      {
        id: 'cargo-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        shoes: {
          black: 'outfits/pants/att/cargo-maple-leaf-fatigue-black.png',
          brown: 'outfits/pants/att/cargo-maple-leaf-fatigue-brown.png',
          tobacco: 'outfits/pants/att/cargo-maple-leaf-fatigue-tobacco.png',
          sneak01: 'outfits/pants/att/cargo-maple-leaf-fatigue-sneak01.png',
        },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Pressed front pleat.
    id: 'pleat',
    name: 'PLEAT®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    colors: [
      {
        id: 'pleat-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        shoes: {
          black: 'outfits/pants/att/pleat-cinnamon-toast-fern-black.png',
          brown: 'outfits/pants/att/pleat-cinnamon-toast-fern-brown.png',
          tobacco: 'outfits/pants/att/pleat-cinnamon-toast-fern-tobacco.png',
          sneak01: 'outfits/pants/att/pleat-cinnamon-toast-fern-sneak01.png',
        },
      },
      {
        id: 'pleat-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        shoes: {
          black: 'outfits/pants/att/pleat-wash-day-trench-black.png',
          brown: 'outfits/pants/att/pleat-wash-day-trench-brown.png',
          tobacco: 'outfits/pants/att/pleat-wash-day-trench-tobacco.png',
          sneak01: 'outfits/pants/att/pleat-wash-day-trench-sneak01.png',
        },
      },
      {
        id: 'pleat-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        shoes: {
          black: 'outfits/pants/att/pleat-maple-leaf-fatigue-black.png',
          brown: 'outfits/pants/att/pleat-maple-leaf-fatigue-brown.png',
          tobacco: 'outfits/pants/att/pleat-maple-leaf-fatigue-tobacco.png',
          sneak01: 'outfits/pants/att/pleat-maple-leaf-fatigue-sneak01.png',
        },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Wide-wale corduroy.
    id: 'cord',
    name: 'CORD®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    colors: [
      {
        id: 'cord-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        shoes: {
          black: 'outfits/pants/att/cord-cinnamon-toast-fern-black.png',
          brown: 'outfits/pants/att/cord-cinnamon-toast-fern-brown.png',
          tobacco: 'outfits/pants/att/cord-cinnamon-toast-fern-tobacco.png',
          sneak01: 'outfits/pants/att/cord-cinnamon-toast-fern-sneak01.png',
        },
      },
      {
        id: 'cord-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        shoes: {
          black: 'outfits/pants/att/cord-wash-day-trench-black.png',
          brown: 'outfits/pants/att/cord-wash-day-trench-brown.png',
          tobacco: 'outfits/pants/att/cord-wash-day-trench-tobacco.png',
          sneak01: 'outfits/pants/att/cord-wash-day-trench-sneak01.png',
        },
      },
      {
        id: 'cord-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        shoes: {
          black: 'outfits/pants/att/cord-maple-leaf-fatigue-black.png',
          brown: 'outfits/pants/att/cord-maple-leaf-fatigue-brown.png',
          tobacco: 'outfits/pants/att/cord-maple-leaf-fatigue-tobacco.png',
          sneak01: 'outfits/pants/att/cord-maple-leaf-fatigue-sneak01.png',
        },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Ribbed knit midi skirt.
    id: 'knit-midi',
    name: 'KNIT MIDI®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    noTuck: true, // a skirt: tops always tuck in
    colors: [
      {
        id: 'knit-midi-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        shoes: {
          black: 'outfits/pants/att/knit-midi-cinnamon-toast-fern-black.png',
          brown: 'outfits/pants/att/knit-midi-cinnamon-toast-fern-brown.png',
          tobacco: 'outfits/pants/att/knit-midi-cinnamon-toast-fern-tobacco.png',
          sneak01: 'outfits/pants/att/knit-midi-cinnamon-toast-fern-sneak01.png',
        },
      },
      {
        id: 'knit-midi-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        shoes: {
          black: 'outfits/pants/att/knit-midi-wash-day-trench-black.png',
          brown: 'outfits/pants/att/knit-midi-wash-day-trench-brown.png',
          tobacco: 'outfits/pants/att/knit-midi-wash-day-trench-tobacco.png',
          sneak01: 'outfits/pants/att/knit-midi-wash-day-trench-sneak01.png',
        },
      },
      {
        id: 'knit-midi-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        shoes: {
          black: 'outfits/pants/att/knit-midi-maple-leaf-fatigue-black.png',
          brown: 'outfits/pants/att/knit-midi-maple-leaf-fatigue-brown.png',
          tobacco: 'outfits/pants/att/knit-midi-maple-leaf-fatigue-tobacco.png',
          sneak01: 'outfits/pants/att/knit-midi-maple-leaf-fatigue-sneak01.png',
        },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Tartan kilt with white knee socks.
    id: 'kilt',
    name: 'KILT®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    noTuck: true, // a skirt: tops always tuck in
    colors: [
      {
        id: 'kilt-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        shoes: {
          black: 'outfits/pants/att/kilt-cinnamon-toast-fern-black.png',
          brown: 'outfits/pants/att/kilt-cinnamon-toast-fern-brown.png',
          tobacco: 'outfits/pants/att/kilt-cinnamon-toast-fern-tobacco.png',
          sneak01: 'outfits/pants/att/kilt-cinnamon-toast-fern-sneak01.png',
        },
      },
      {
        id: 'kilt-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        shoes: {
          black: 'outfits/pants/att/kilt-wash-day-trench-black.png',
          brown: 'outfits/pants/att/kilt-wash-day-trench-brown.png',
          tobacco: 'outfits/pants/att/kilt-wash-day-trench-tobacco.png',
          sneak01: 'outfits/pants/att/kilt-wash-day-trench-sneak01.png',
        },
      },
      {
        id: 'kilt-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        shoes: {
          black: 'outfits/pants/att/kilt-maple-leaf-fatigue-black.png',
          brown: 'outfits/pants/att/kilt-maple-leaf-fatigue-brown.png',
          tobacco: 'outfits/pants/att/kilt-maple-leaf-fatigue-tobacco.png',
          sneak01: 'outfits/pants/att/kilt-maple-leaf-fatigue-sneak01.png',
        },
      },
    ],
  },
  {
    // AMONG THE TREES® (GOOD® CAPSULE Nº2). Long skirt with a side slit.
    id: 'maxi',
    name: 'MAXI®',
    isNew: true, // AMONG THE TREES®: NEW tag on the card
    noTuck: true, // a skirt: tops always tuck in
    colors: [
      {
        id: 'maxi-cinnamon-toast-fern',
        color: 'CINNAMON TOAST/FERN',
        swatch: ['#a65a2e', '#4f6b45'],
        shoes: {
          black: 'outfits/pants/att/maxi-cinnamon-toast-fern-black.png',
          brown: 'outfits/pants/att/maxi-cinnamon-toast-fern-brown.png',
          tobacco: 'outfits/pants/att/maxi-cinnamon-toast-fern-tobacco.png',
          sneak01: 'outfits/pants/att/maxi-cinnamon-toast-fern-sneak01.png',
        },
      },
      {
        id: 'maxi-wash-day-trench',
        color: 'WASH DAY/TRENCH',
        swatch: ['#8eaee6', '#c4b38a'],
        shoes: {
          black: 'outfits/pants/att/maxi-wash-day-trench-black.png',
          brown: 'outfits/pants/att/maxi-wash-day-trench-brown.png',
          tobacco: 'outfits/pants/att/maxi-wash-day-trench-tobacco.png',
          sneak01: 'outfits/pants/att/maxi-wash-day-trench-sneak01.png',
        },
      },
      {
        id: 'maxi-maple-leaf-fatigue',
        color: 'MAPLE LEAF/FATIGUE',
        swatch: ['#c2452b', '#4a4f2f'],
        shoes: {
          black: 'outfits/pants/att/maxi-maple-leaf-fatigue-black.png',
          brown: 'outfits/pants/att/maxi-maple-leaf-fatigue-brown.png',
          tobacco: 'outfits/pants/att/maxi-maple-leaf-fatigue-tobacco.png',
          sneak01: 'outfits/pants/att/maxi-maple-leaf-fatigue-sneak01.png',
        },
      },
    ],
  },
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
    colors: [{ id: 'pltswt-heather-grey', color: 'FLECK', swatch: '#9a9ca3' }],
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
