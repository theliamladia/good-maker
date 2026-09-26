// Available outfits: one 64x64 PNG per body type, per sleeve length.
// bodies = short-sleeve set, long = long-sleeve set; either may be left out,
// and within a set a body may be left out. Options an outfit doesn't have are
// hidden from the Body / Sleeve controls while it's selected.
// Leave body areas transparent where skin should show; the head area is ignored.
// classic = 4px (Steve) arms, slim = 3px (Alex) arms.
// color (optional) = colourway, shown smaller under the name.
// Shirts: the legs of these files are ignored and replaced by the chosen pants
// (window.PANTS below). pants (optional) = pants picked by default with this
// shirt, until the user chooses pants themselves.
// locked: true = preview only. The PNG isn't in this repo; it's served
// scrambled by /api/outfit (see api/outfit.js) and can't be downloaded.
window.OUTFITS = [
  {
    id: 'good-jean',
    name: 'GOOD® JEAN',
    color: 'White/Denim',
    bodies: {
      classic: 'outfits/good-jean-classic.png',
      slim: 'outfits/good-jean-slim.png',
    },
    long: {
      classic: 'outfits/good-jean-long-classic.png',
      slim: 'outfits/good-jean-long-slim.png',
    },
  },
  {
    id: 'good-jean-blaue-powder',
    name: 'GOOD® JEAN',
    color: 'Blaue/Powder',
    bodies: {
      classic: 'outfits/good-jean-blaue-powder-classic.png',
      slim: 'outfits/good-jean-blaue-powder-slim.png',
    },
    long: {
      classic: 'outfits/good-jean-blaue-powder-long-classic.png',
      slim: 'outfits/good-jean-blaue-powder-long-slim.png',
    },
  },
  {
    id: 'good-lab-destroyed',
    name: 'GOOD LAB®',
    color: 'Destroyed',
    pants: 'mosaic-pant-linen-lapis',
    long: {
      slim: 'outfits/good-lab-destroyed-long-slim.png',
    },
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
    bodies: {
      slim: 'api/outfit?id=founders',
    },
  },
];

// Pants: leg-only textures (both layers), shared by Classic and Slim.
// The first one is the default.
window.PANTS = [
  { id: 'good-jean-black', name: 'GOOD® JEAN', color: 'Black Shoes', src: 'outfits/pants/good-jean-black.png' },
  { id: 'good-jean-brown', name: 'GOOD® JEAN', color: 'Brown Shoes', src: 'outfits/pants/good-jean-brown.png' },
  { id: 'mosaic-pant-linen-lapis', name: 'MOSAIC PANT', color: 'Linen/Lapis', src: 'outfits/pants/mosaic-pant-linen-lapis.png' },
];
