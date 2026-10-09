// Player heads: the 8×8 face (base) with the hat layer over it, drawn from a
// skin into a canvas. No skin: a GOOD® BLUE square with the G.
window.GoodHeads = (() => {
  const G = ['####', '#...', '#.##', '#..#', '####'];
  function placeholder(cv) {
    cv.width = cv.height = 8; const x = cv.getContext('2d');
    x.fillStyle = '#0000ff'; x.fillRect(0, 0, 8, 8); x.fillStyle = '#ffffff';
    G.forEach((r, y) => [...r].forEach((c, i) => { if (c === '#') x.fillRect(2 + i, 1 + y, 1, 1); }));
  }
  function draw(cv, src) {
    placeholder(cv);
    if (!src) return Promise.resolve();
    return new Promise((ok) => {
      const img = new Image();
      img.onload = () => { const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 8, 8); x.drawImage(img, 8, 8, 8, 8, 0, 0, 8, 8); x.drawImage(img, 40, 8, 8, 8, 0, 0, 8, 8); ok(); };
      img.onerror = () => ok();
      img.src = src;
    });
  }
  return { draw, placeholder };
})();
