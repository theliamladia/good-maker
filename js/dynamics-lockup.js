// DYNAMICS® lockup builder (the mark leads the word; proportions in cap heights). Used by /dynamics.
// Metrics measured at 200px: cap 150 (0.75em), stem 18.6 (0.093em = 0.124 cap), bar 16 (0.08em).
const NS = 'http://www.w3.org/2000/svg';
const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); p.append(e); return e; };
const CAP = 0.75, STEM = 0.093;

// Build a lockup inside `svg`. x,y = left edge and baseline of the word (word position is then shifted
// if the mark leads). Returns the geometry used (css px) for the caption/measurement.
function lockup(svg, o) {
  const F = o.size, cap = CAP * F, stem = STEM * F, fill = o.fill || '#fff';
  const track = (o.track == null ? 0.06 : o.track) * F;
  const sq = o.sq * cap;                       // one square of the mark
  const mw = 4 * sq, mh = 2 * sq;              // mark box
  const gap = (o.gap == null ? 0.75 : o.gap) * cap;
  const g = el('g', {}, svg);
  // word
  const t = el('text', { x: 0, y: 0, fill, 'font-family': 'Michroma', 'font-size': F, 'letter-spacing': track }, g);
  t.textContent = 'DYNAMICS';
  const bb = t.getBBox();                      // bb.x..bb.x+bb.width is the advance box; ink is very close in Michroma
  const wordW = bb.width - track;              // drop the trailing letter-space
  // mark origin
  let mx, my, wx = 0;
  const top = -cap;
  if (o.pos === 'lead') { mx = 0; wx = mw + gap; }
  else if (o.pos === 'trail') { mx = wordW + gap; }
  else { mx = (wordW - mw) / 2; }
  if (o.pos === 'stack') my = top - (o.stackGap == null ? 0.75 : o.stackGap) * cap - mh;
  else if (o.valign === 'base') my = -mh;
  else if (o.valign === 'cap') my = top;
  else my = top + (cap - mh) / 2 - (o.lift || 0) * cap;   // centred on the cap height, optional optical lift
  t.setAttribute('x', wx);
  const rect = (x, y, w, h) => el('rect', { x: mx + x, y: my + y, width: w, height: h, fill }, g);
  if (o.outline) {
    const s = stem, r = (x, y, w, h) => el('rect', { x: mx + x + s / 2, y: my + y + s / 2, width: w - s, height: h - s, fill: 'none', stroke: fill, 'stroke-width': s }, g);
    r(sq, 0, 2 * sq, sq); r(0, sq, sq, sq); r(3 * sq, sq, sq, sq);
  } else { rect(sq, 0, 2 * sq, sq); rect(0, sq, sq, sq); rect(3 * sq, sq, sq, sq); }
  // ®
  let rx = 0, ry = 0, rw = 0;
  if (o.reg !== false) {
    const rs = (o.regSize == null ? 0.22 : o.regSize) * cap;      // ® height ≈ 0.22 cap
    const after = o.regAfter === 'mark' ? mx + mw : wx + wordW;
    rx = after + (o.regGap == null ? 0.12 : o.regGap) * cap;
    const R = el('text', { x: rx, y: 0, fill, 'font-family': 'Michroma', 'font-size': rs / 0.75 }, g);
    R.textContent = '®';
    const rb = R.getBBox(); rw = rb.width;
    // Michroma's ® sits on the baseline at its own cap height (0.75em of rs/0.75 = rs). Align its top to cap line or its foot to baseline.
    ry = o.regPos === 'base' ? 0 : top + rs;
    R.setAttribute('y', ry);
  }
  const totalW = Math.max(wx + wordW, mx + mw, rx + rw);
  const minY = Math.min(my, top), maxY = Math.max(my + mh, 0);
  // Michroma's D carries a 0.13 cap left sidebearing; align the ink, not the advance box, to the margin.
  const inkShift = (o.pos === 'lead') ? 0 : -0.13 * cap;
  let ox = o.x + inkShift;
  if (o.centre) ox = o.x - (totalW + inkShift) / 2;    // centre the ink on o.x
  g.setAttribute('transform', `translate(${ox},${o.y})`);
  return { cap, stem, sq, mw, mh, mx, my, wx, wordW, totalW, minY, maxY, rx, rw };
}
