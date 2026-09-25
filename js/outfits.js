// Available outfits. Each has one 64x64 PNG per body type.
// Leave body areas transparent where skin should show; the head area is ignored.
// classic = 4px (Steve) arms, slim = 3px (Alex) arms.
// color (optional) = colourway, shown smaller under the name.
// long (optional) = long-sleeve versions, picked with the Sleeve control.
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
    bodies: {
      slim: 'outfits/good-lab-destroyed-slim.png',
    },
  },
  {
    id: 'founders',
    name: 'FOUNDERS EDITION',
    locked: true,
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
