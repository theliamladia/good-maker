// "How do I use this?" pop-ups for Hair and Headwear.
// Each one plays a short looping pixel animation of a little figure, with a
// mock of the real controls lighting up in sync and a pointer that erases.
(() => {
  const S = 9;              // screen px per skin pixel
  const W = 18, H = 34;     // figure grid (1px margin for the hood)
  const C = {
    skin: '#e0ac8c', skinShade: '#c9947a', eye: '#2b2b3a', mouth: '#b86b5c',
    hair: '#5a3a26', hairLight: '#6f4a31',
    shirt: '#ffffff', shirtShade: '#e3e9f0', logo: '#6cc3ff',
    jean: '#57b3ea', jeanShade: '#3f97d1', shoe: '#1b1b22',
    hood: '#6f9f5c', hoodShade: '#5b8a4b', bow: '#e8506a', bowShade: '#c23a55',
  };

  // --- Figure --------------------------------------------------------------
  // Front view, offset by (1,1). Head x5..13 y1..9, torso x5..13 y9..21,
  // arms x1..5 / x13..17, legs y21..33.
  function drawFigure(ctx, { hairRows = 0, erasedHair = new Set(), hood = false, bow = false, erasedBow = new Set() }) {
    const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * S, y * S, S, S); };
    const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c); };

    // Arms (skin with short sleeves), legs, shoes
    rect(1, 9, 4, 12, C.skin); rect(13, 9, 4, 12, C.skin);
    rect(1, 9, 4, 3, C.shirtShade); rect(13, 9, 4, 3, C.shirtShade);
    rect(1, 20, 4, 1, C.skinShade); rect(13, 20, 4, 1, C.skinShade);
    rect(5, 21, 8, 11, C.jean); rect(9, 21, 1, 11, C.jeanShade);
    rect(5, 32, 8, 1, C.shoe);
    // Torso: shirt with a logo
    rect(5, 9, 8, 12, C.shirt); rect(5, 20, 8, 1, C.shirtShade);
    rect(8, 12, 2, 1, C.logo); rect(7, 13, 1, 2, C.logo); rect(8, 15, 2, 1, C.logo); rect(9, 14, 1, 1, C.logo);
    // Head
    rect(5, 1, 8, 8, C.skin);
    rect(5, 1, 8, 2, C.hair); rect(5, 3, 1, 5, C.hair); rect(12, 3, 1, 5, C.hair); rect(6, 3, 2, 1, C.hairLight);
    px(7, 5, C.eye); px(10, 5, C.eye); rect(8, 7, 2, 1, C.mouth);

    // Long hair hanging onto the torso (two strands), minus erased pixels
    for (let r = 0; r < hairRows; r++) {
      for (const x of [5, 6, 11, 12]) {
        if (erasedHair.has(`${x},${9 + r}`)) continue;
        px(x, 9 + r, (x === 6 || x === 11) ? C.hairLight : C.hair);
      }
    }
    // Hood: a frame one pixel outside the head, draping onto the shoulders
    if (hood) {
      rect(4, 0, 10, 1, C.hood); rect(4, 1, 1, 9, C.hood); rect(13, 1, 1, 9, C.hood);
      rect(5, 0, 8, 1, C.hoodShade);
      rect(5, 9, 2, 1, C.hoodShade); rect(11, 9, 2, 1, C.hoodShade);
    }
    // Bow on the hat layer
    if (bow) {
      for (const [x, y, c] of [[11, 0, C.bow], [12, 0, C.bow], [13, 0, C.bow], [12, 1, C.bowShade], [11, 1, C.bow], [13, 1, C.bow]]) {
        if (!erasedBow.has(`${x},${y}`)) px(x, y, c);
      }
    }
  }

  // --- Scripts -------------------------------------------------------------
  // Each step: { dur (s), caption, chips: [labels], active(t) -> lit chip,
  //   state(t) -> figure options, cursor(t) -> [x, y] in figure pixels
  //   (or cursorOn: 'chips' to point at the lit chip), erasing(t) -> bool }
  const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));

  const HELP = {
    hair: {
      title: 'Hair',
      steps: [
        {
          dur: 4.4,
          caption: 'Pick how long your hair is. It’s laid over the new outfit.',
          chips: ['Off', 'Short', 'Mid', 'Long'],
          active: (t) => Math.min(3, Math.floor(t / 1.1)),
          state: (t) => ({ hairRows: [0, 4, 8, 12][Math.min(3, Math.floor(t / 1.1))] }),
          cursorOn: 'chips',
        },
        {
          dur: 4.4,
          caption: 'Stray pixels? Open the TORSO eraser and brush over them.',
          chips: ['HEAD', 'TORSO'],
          active: () => 1,
          state: (t) => {
            const erased = new Set();
            const y = lerp(9, 21.5, (t - 0.6) / 3.2);
            for (let r = 9; r < 21; r++) if (r < y) { erased.add(`5,${r}`); erased.add(`6,${r}`); }
            return { hairRows: 12, erasedHair: erased };
          },
          cursor: (t) => [6, lerp(9, 21, (t - 0.6) / 3.2)],
          erasing: (t) => t > 0.6 && t < 3.8,
        },
      ],
    },
    headwear: {
      title: 'Headwear',
      steps: [
        {
          dur: 4.8,
          caption: 'Hoods from your old outfit clash with the new one. “No hood” removes them.',
          chips: ['Keep', 'No hood', 'None'],
          active: (t) => Math.min(2, Math.floor(t / 1.6)),
          state: (t) => {
            const i = Math.min(2, Math.floor(t / 1.6));
            return { hood: i === 0, bow: i < 2 };
          },
          cursorOn: 'chips',
        },
        {
          dur: 4.2,
          caption: 'Anything else left? Brush it away in the HEAD eraser. UNDO if you slip.',
          chips: ['HEAD', 'TORSO'],
          active: () => 0,
          state: (t) => {
            const erased = new Set();
            const x = lerp(10.5, 14, (t - 0.8) / 2.4);
            for (const k of ['11,0', '11,1', '12,0', '12,1', '13,0', '13,1']) if (+k.split(',')[0] < x) erased.add(k);
            return { bow: true, erasedBow: erased };
          },
          cursor: (t) => [lerp(11, 13.5, (t - 0.8) / 2.4), 0.5],
          erasing: (t) => t > 0.8 && t < 3.4,
        },
      ],
    },
  };

  // --- Modal ---------------------------------------------------------------
  const modal = document.createElement('div');
  modal.className = 'help-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="help-backdrop" data-close></div>
    <div class="help-card" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
      <button type="button" class="help-close mono" data-close aria-label="Close">✕</button>
      <div class="section-tag mono" id="helpTitle"></div>
      <div class="help-stage">
        <canvas width="${W * S}" height="${H * S}"></canvas>
        <div class="help-cursor" aria-hidden="true"></div>
      </div>
      <div class="help-chips mono"></div>
      <p class="help-caption"></p>
      <div class="help-dots"></div>
    </div>`;
  document.body.appendChild(modal);

  const canvas = modal.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const cursor = modal.querySelector('.help-cursor');
  const chipsEl = modal.querySelector('.help-chips');
  const captionEl = modal.querySelector('.help-caption');
  const dotsEl = modal.querySelector('.help-dots');
  let raf = 0, script = null, start = 0, lastStep = -1;

  function frame(now) {
    const total = script.steps.reduce((a, s) => a + s.dur, 0);
    let t = (Math.max(0, now - start) / 1000) % total; // rAF time can precede start
    let i = 0;
    while (t >= script.steps[i].dur) { t -= script.steps[i].dur; i++; }
    const step = script.steps[i];

    if (i !== lastStep) {
      lastStep = i;
      chipsEl.innerHTML = step.chips.map((c) => `<span>${c}</span>`).join('');
      captionEl.textContent = `${i + 1}. ${step.caption}`;
      dotsEl.innerHTML = script.steps.map((_, j) => `<span class="${j === i ? 'on' : ''}"></span>`).join('');
    }
    [...chipsEl.children].forEach((el, j) => el.classList.toggle('on', j === step.active(t)));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFigure(ctx, step.state(t));

    // Pointer: over the figure (grid coords) or over the chip row
    if (step.cursorOn === 'chips') {
      const chip = chipsEl.children[step.active(t)];
      const stage = canvas.parentElement.getBoundingClientRect();
      const r = chip.getBoundingClientRect();
      // cursor is positioned from the stage's 10px padding corner
      cursor.style.transform = `translate(${r.left - stage.left + r.width / 2 - 10}px, ${r.top - stage.top + r.height / 2 - 10}px)`;
    } else {
      const [cx, cy] = step.cursor(t);
      const scale = canvas.clientWidth / canvas.width;
      cursor.style.transform = `translate(${cx * S * scale}px, ${cy * S * scale}px)`;
    }
    cursor.classList.toggle('erasing', !!(step.erasing && step.erasing(t)));

    raf = requestAnimationFrame(frame);
  }

  function open(topic) {
    script = HELP[topic];
    modal.querySelector('#helpTitle').textContent = `HOW TO / ${script.title.toUpperCase()}`;
    modal.hidden = false;
    lastStep = -1;
    start = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    modal.querySelector('.help-close').focus();
  }
  function close() {
    modal.hidden = true;
    cancelAnimationFrame(raf);
  }

  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-help]');
    if (btn) open(btn.dataset.help);
  });
})();
