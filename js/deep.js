// DEEP END®: the underwater drop. A pineapple floats in the corner; clicking
// it sends bubbles up the screen, the page sinks underwater, and the looks
// appear on the player's own skin (from the main page, or any Minecraft
// username typed in), each with a GOOD ME® download.
(() => {
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  // top = shirt file per body; pants = pants file; holes = GOODIE® (base layer
  // only fills the G, see SkinLib.baseUnderHoles).
  const deep = (id) => ({ top: (b) => `outfits/deep/goodie-${id}-${b}.png`, bottom: `outfits/deep/pants-${id}.png`, holes: true });
  const LOOKS = [
    { name: 'GOODIE® SQUARE', color: 'SPONGE/GOOD® BLUE', pants: 'JEAN® TROUSER BROWN', ...deep('square') },
    { name: 'GOODIE® STAR', color: 'STARFISH PINK/GOOD® BLUE', pants: 'JORT® SEAFOAM GREEN', ...deep('star') },
    { name: 'GOODIE® DROP', color: 'TENTACLE TEAL/GOOD® BLUE', pants: 'JEAN® DEEP TEAL', ...deep('drop') },
    { name: 'GOODIE® CLAW', color: 'CLAW RED/GOOD® BLUE', pants: 'JEAN® ANCHOR BLUE', ...deep('claw') },
    {
      // Krusty employee: the GOOD® shirt with a Krab red G, bootcut SPRINGSTEEN™ jeans.
      name: 'SHIRT® KRAB', color: 'COTTON/KRAB RED', pants: 'JEAN® BOOTCUT SPRINGSTEEN™',
      top: (b) => `outfits/deep/shirt-krab-${b}.png`, bottom: 'outfits/pants/good-jean-bootcut-black.png',
    },
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Pineapple ----------
  const pine = document.createElement('button');
  pine.type = 'button';
  pine.className = 'dp-pine';
  pine.setAttribute('aria-label', 'DEEP END® - dive in');
  pine.innerHTML = '<img src="assets/pineapple.webp" alt=""><span class="dp-pine-tag mono">DIVE IN</span>';
  document.body.appendChild(pine);

  // ---------- Water ----------
  const water = document.createElement('div');
  water.className = 'dp-water';
  water.innerHTML = '<div class="dp-surface"></div><div class="dp-rays"></div>';
  water.hidden = true;
  document.body.appendChild(water);
  // Bubbles live in their own layer so they can rise above the water line.
  const fizz = document.createElement('div');
  fizz.className = 'dp-fizz';
  document.body.appendChild(fizz);

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = src;
  });
  const pixels = async (src) => {
    const img = await loadImage(src);
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
  };

  // Bubbles rising from the bottom; `to` = how far up (0..1 of the screen).
  function bubbles(host, count, to, dur) {
    const all = [];
    for (let i = 0; i < count; i++) {
      const b = document.createElement('span');
      b.className = 'dp-bubble';
      const size = 6 + Math.random() * Math.random() * 46;
      b.style.width = b.style.height = `${size}px`;
      b.style.left = `${Math.random() * 100}%`;
      host.appendChild(b);
      const rise = innerHeight * to * (0.55 + Math.random() * 0.45);
      const sway = (Math.random() - 0.5) * 60;
      const a = b.animate([
        { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
        { opacity: 0.95, offset: 0.15 },
        { transform: `translate(${sway}px, ${-rise * 0.6}px) scale(1)`, offset: 0.6 },
        { transform: `translate(${-sway / 2}px, ${-rise}px) scale(1.05)`, opacity: 0 },
      ], { duration: dur * (0.7 + Math.random() * 0.6), delay: Math.random() * dur * 0.5, easing: 'cubic-bezier(0.3, 0.1, 0.4, 1)', fill: 'backwards' });
      all.push(a.finished.then(() => b.remove()));
    }
    return Promise.all(all);
  }

  // ---------- Stage ----------
  let stage = null;
  let viewers = [];
  let ambient = null;

  async function dive() {
    if (stage) return;
    window.GoodApp.setModalOpen(true);
    document.body.classList.add('dp-on');
    pine.classList.add('dp-gone');
    water.hidden = false;
    if (!reduced) {
      // Bubbles fill the bottom half, then the water rises over everything.
      bubbles(fizz, 90, 0.5, 1600);
      await water.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(50%)' }],
        { duration: 1400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }).finished;
      bubbles(fizz, 40, 0.9, 1400);
      await water.animate([{ transform: 'translateY(50%)' }, { transform: 'translateY(0)' }],
        { duration: 900, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'forwards' }).finished;
      water.classList.add('dp-full'); // deep enough: the page above fades away
    } else {
      water.classList.add('dp-full');
      water.style.transform = 'none';
    }
    buildStage();
  }

  async function surface() {
    if (!stage) return;
    const s = stage;
    stage = null;
    clearInterval(ambient);
    await s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }).finished;
    viewers.forEach((v) => v.dispose());
    viewers = [];
    s.remove();
    water.classList.remove('dp-full');
    if (!reduced) {
      bubbles(fizz, 30, 0.6, 1000);
      await water.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }],
        { duration: 1100, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'forwards' }).finished;
    }
    water.getAnimations().forEach((a) => a.cancel());
    water.hidden = true;
    document.body.classList.remove('dp-on');
    pine.classList.remove('dp-gone');
    window.GoodApp.setModalOpen(false);
  }

  function buildStage() {
    const cur = window.GoodApp.current();
    stage = document.createElement('section');
    stage.className = 'dp-stage';
    stage.innerHTML = `
      <header class="dp-head">
        <button type="button" class="dp-back mono">↑ SURFACE</button>
        <div class="dp-title">DEEP END®</div>
        <form class="dp-user" autocomplete="off">
          <input class="mono" type="text" maxlength="16" spellcheck="false" autocapitalize="off"
            placeholder="MINECRAFT USERNAME" aria-label="Minecraft username">
          <button type="submit" aria-label="Load skin">→</button>
        </form>
      </header>
      <p class="dp-msg mono" aria-live="polite"></p>
      <div class="dp-looks"></div>
      <p class="dp-legal mono">© ${new Date().getFullYear()} GOOD® DESIGN. ALL RIGHTS RESERVED.</p>`;
    document.body.appendChild(stage);
    stage.querySelector('.dp-back').onclick = surface;
    const input = stage.querySelector('.dp-user input');
    const msg = stage.querySelector('.dp-msg');
    if (!cur.isDemo && /^[A-Za-z0-9_]{3,16}$/.test(cur.name || '')) input.value = cur.name;

    // Looks: cards now, skins drawn by show().
    const row = stage.querySelector('.dp-looks');
    const cards = LOOKS.map((look, i) => {
      const col = document.createElement('article');
      col.className = 'dp-look';
      col.innerHTML = `
        <div class="dp-view"></div>
        <div class="dp-name">${look.name}</div>
        <div class="dp-color mono">${look.color}<br>${look.pants}</div>
        <button type="button" class="dp-get">GOOD ME®</button>`;
      row.appendChild(col);
      col.animate([{ transform: 'translateY(80px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 1000, delay: 150 + i * 140, easing: EASE_OUT, fill: 'backwards' });
      return { look, col, view: col.querySelector('.dp-view'), tex: null, viewer: null };
    });
    stage.querySelector('.dp-head').animate([{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'none' }],
      { duration: 700, delay: 200, easing: EASE_OUT, fill: 'backwards' });

    let name = cur.isDemo ? 'GOOD' : (cur.name || 'GOOD');
    const show = async (skin) => {
      const slim = SkinLib.detectSlim(skin);
      const tone = SkinLib.sampleSkinTone(skin);
      const hairRows = slim ? SkinLib.estimateHairRows(skin, tone) : 0;
      for (const c of cards) {
        let top = await pixels(c.look.top(slim ? 'slim' : 'classic'));
        if (c.look.holes) top = SkinLib.baseUnderHoles(top);
        const outfit = SkinLib.combineOutfit(top, await pixels(c.look.bottom));
        const merged = SkinLib.mergeSkin(skin, outfit, tone, slim, hairRows, null, 'auto');
        if (!c.tex) { c.tex = document.createElement('canvas'); c.tex.width = c.tex.height = 64; }
        c.tex.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
        if (window.skinview3d) {
          if (!c.viewer) {
            c.viewer = new skinview3d.SkinViewer({ canvas: document.createElement('canvas'), width: c.view.clientWidth || 220, height: c.view.clientHeight || 320 });
            c.viewer.animation = new skinview3d.IdleAnimation();
            c.viewer.zoom = 0.8;
            c.view.appendChild(c.viewer.canvas);
            viewers.push(c.viewer);
          }
          c.viewer.loadSkin(c.tex, { model: slim ? 'slim' : 'default' });
        }
        c.col.querySelector('.dp-get').onclick = () => {
          const a = document.createElement('a');
          a.href = c.tex.toDataURL('image/png');
          a.download = `${name.replace(/[^A-Za-z0-9_]/g, '')}GOOD.png`;
          a.click();
        };
      }
    };
    if (cur.skin) show(cur.skin);

    stage.querySelector('.dp-user').onsubmit = async (e) => {
      e.preventDefault();
      const n = input.value.trim();
      if (!/^[A-Za-z0-9_]{3,16}$/.test(n)) { msg.textContent = 'ENTER A VALID MINECRAFT USERNAME.'; return; }
      msg.textContent = 'FETCHING SKIN…';
      try {
        const skin = await window.GoodApp.skinForName(n);
        name = n;
        await show(skin);
        msg.textContent = '';
      } catch (err) {
        msg.textContent = err && err.message && /^[A-Z]/.test(err.message) ? err.message : 'COULD NOT FIND THAT PLAYER.';
      }
    };

    // Ambient bubbles while underwater.
    if (!reduced) {
      bubbles(fizz, 14, 1.1, 5000);
      ambient = setInterval(() => bubbles(fizz, 5, 1.1, 5000), 1600);
    }
  }

  pine.onclick = dive;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && stage) surface(); });
  window.GoodDeep = { dive, surface };
})();
