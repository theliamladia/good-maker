// Available outfits. Each has one 64x64 PNG per body type.
// Leave body areas transparent where skin should show; the head area is ignored.
// classic = 4px (Steve) arms, slim = 3px (Alex) arms.
// locked: true = preview only. The PNG isn't in this repo; it's served
// scrambled by /api/outfit (see api/outfit.js) and can't be downloaded.
window.OUTFITS = [
  {
    id: 'good-jean',
    name: 'GOOD® JEAN White/Denim',
    bodies: {
      classic: 'outfits/good-jean-classic.png',
      slim: 'outfits/good-jean-slim.png',
    },
  },
  {
    id: 'good-jean-blaue-powder',
    name: 'GOOD® JEAN Blaue/Powder',
    bodies: {
      classic: 'outfits/good-jean-blaue-powder-classic.png',
      slim: 'outfits/good-jean-blaue-powder-slim.png',
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
