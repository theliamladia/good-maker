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
];
