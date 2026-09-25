// Available outfits. Each has one 64x64 PNG per body type.
// Leave body areas transparent where skin should show; the head area is ignored.
// classic = 4px (Steve) arms, slim = 3px (Alex) arms.
// locked: true = preview only. The PNG isn't in this repo; it's served
// scrambled by /api/outfit (see api/outfit.js) and can't be downloaded.
window.OUTFITS = [
  {
    id: 'good-jean',
    name: 'GOOD® JEAN',
    bodies: {
      classic: 'outfits/good-jean-classic.png',
      slim: 'outfits/good-jean-slim.png',
    },
  },
  {
    id: 'founders',
    name: 'FOUNDERS EDITION',
    locked: true,
    bodies: {
      slim: 'api/outfit?id=founders',
    },
  },
];
