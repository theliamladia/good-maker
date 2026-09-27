// The catalogue is organised by kind (one card each) and colour (picked
// under the cards). Each colour has one 64x64 PNG per body type, per sleeve:
// bodies = short-sleeve set, long = long-sleeve set; either may be left out,
// and within a set a body may be left out. Options a colour doesn't have are
// hidden from the Body / Sleeve controls while it's selected.
// Leave body areas transparent where skin should show; the head area is ignored.
// classic = 4px (Steve) arms, slim = 3px (Alex) arms.
// swatch = the colour dot shown in the colour picker.
// Shirts: the legs of these files are ignored and replaced by the chosen pants
// (window.PANTS below). pants (optional) = pants colour id picked by default
// with this shirt, until the user chooses pants themselves.
// locked: true = preview only. The PNG isn't in this repo; it's served
// scrambled by /api/outfit (see api/outfit.js) and can't be downloaded.
window.OUTFITS = [
  {
    id: 'shirt',
    name: 'SHIRT®',
    colors: [
      {
        id: 'shirt-denim',
        color: 'Denim',
        swatch: '#ffffff',
        bodies: { classic: 'outfits/good-jean-classic.png', slim: 'outfits/good-jean-slim.png' },
        long: { classic: 'outfits/good-jean-long-classic.png', slim: 'outfits/good-jean-long-slim.png' },
      },
      {
        id: 'shirt-blaue',
        color: 'Blaue',
        swatch: '#2468ff',
        bodies: { classic: 'outfits/good-jean-blaue-powder-classic.png', slim: 'outfits/good-jean-blaue-powder-slim.png' },
        long: { classic: 'outfits/good-jean-blaue-powder-long-classic.png', slim: 'outfits/good-jean-blaue-powder-long-slim.png' },
      },
    ],
  },
  {
    id: 'good-lab',
    name: 'GOOD LAB®',
    colors: [
      {
        id: 'good-lab-destroyed',
        color: 'Destroyed',
        swatch: '#0f5aff',
        pants: 'mosaic-pant-linen-lapis',
        long: { slim: 'outfits/good-lab-destroyed-long-slim.png' },
      },
    ],
  },
  {
    id: 'smiley',
    name: 'SMILEY®',
    colors: [
      {
        id: 'smiley-pumpkin-neon',
        color: 'Pumpkin/Neon',
        swatch: '#fda327',
        long: {
          classic: 'outfits/smiley-hoodie-pumpkin-neon-long-classic.png',
          slim: 'outfits/smiley-hoodie-pumpkin-neon-long-slim.png',
        },
      },
    ],
  },
  {
    id: 'goodie',
    name: 'GOODIE®',
    colors: [
      {
        id: 'goodie-pepsi',
        color: 'Pepsi',
        swatch: '#1f3fcf',
        long: { classic: 'outfits/goodie-pepsi-long-classic.png', slim: 'outfits/goodie-pepsi-long-slim.png' },
      },
    ],
  },
  {
    id: 'founders',
    name: 'FOUNDERS EDITION',
    locked: true, // complete outfit incl. its own pants; the Pants picker hides
    // Card shown next to the 3D preview while this outfit is selected.
    notice: {
      tag: 'FOUNDERS® / COMING SOON',
      title: 'FOUNDERS® will drop in limited quantity once released.',
      free: 'FREE FREE FREE I WILL NOT CHARGE',
    },
    colors: [{ id: 'founders', bodies: { slim: 'api/outfit?id=founders' } }],
  },
];

// Pants: legs (both layers) plus anything on the torso that belongs to the
// pants (waistband, boxers). Shared by Classic and Slim.
// The first colour of the first kind is the default.
window.PANTS = [
  {
    id: 'jean',
    name: 'JEAN®',
    colors: [
      { id: 'good-jean-black', color: 'Black Shoe', swatch: '#1b1b1f', src: 'outfits/pants/good-jean-black.png' },
      { id: 'good-jean-brown', color: 'Brown Shoe', swatch: '#5a1e14', src: 'outfits/pants/good-jean-brown.png' },
    ],
  },
  {
    id: 'jean-sagging',
    name: 'JEAN®',
    colors: [{ id: 'good-jean-sagging', color: 'Sagging', swatch: '#004cae', src: 'outfits/pants/good-jean-sagging.png' }],
  },
  {
    id: 'mosaic-pant',
    name: 'MOSAIC PANT',
    colors: [{ id: 'mosaic-pant-linen-lapis', color: 'Linen/Lapis', swatch: '#f5ecd8', src: 'outfits/pants/mosaic-pant-linen-lapis.png' }],
  },
];
