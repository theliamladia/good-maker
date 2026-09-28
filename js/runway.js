// RUNWAY®: password-locked looks.
// The prompt asks for a Minecraft username and the password. The password is
// only ever checked by /api/runway on the server; nothing here knows it. On
// success the page flies apart, the sky turns pure blue, and the looks slide
// in on that player's skin, each with a single ACCESS® LOOK download.
(() => {
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_IN = 'cubic-bezier(0.7, 0, 0.84, 0)';
  const PAGE_ITEMS = ['.site-header', '.ticker-top', '.viewer-wrap', '.panel.left', '.right-col', '.ticker-band'];

  // ---------- Prompt ----------
  const modal = document.createElement('div');
  modal.className = 'rw-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="rw-backdrop" data-close></div>
    <form class="rw-card" autocomplete="off" role="dialog" aria-modal="true" aria-labelledby="rwTitle">
      <button type="button" class="rw-close mono" data-close aria-label="Close">✕</button>
      <div class="section-tag mono">RESTRICTED</div>
      <h2 id="rwTitle">RUNWAY®</h2>
      <label class="rw-field mono">MINECRAFT USERNAME
        <input id="rwUser" type="text" maxlength="16" spellcheck="false" autocapitalize="off" required>
      </label>
      <label class="rw-field mono">SITE PASSWORD
        <input id="rwPass" type="password" autocomplete="off" required>
      </label>
      <p class="rw-warn mono">DO NOT PUT YOUR MINECRAFT PASSWORD IN</p>
      <p class="rw-error mono" id="rwError" hidden></p>
      <button type="submit" class="rw-enter" id="rwEnter">ENTER</button>
    </form>`;
  document.body.appendChild(modal);
  const $ = (id) => document.getElementById(id);
  const form = modal.querySelector('form');

  function open() {
    const cur = window.GoodApp.current();
    $('rwUser').value = cur.isDemo ? '' : (cur.name && /^[A-Za-z0-9_]{3,16}$/.test(cur.name) ? cur.name : '');
    $('rwPass').value = '';
    $('rwError').hidden = true;
    modal.hidden = false;
    window.GoodApp.setModalOpen(true);
    ($('rwUser').value ? $('rwPass') : $('rwUser')).focus();
  }
  function close() {
    modal.hidden = true;
    $('rwPass').value = '';
    window.GoodApp.setModalOpen(false);
  }
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  const fail = (msg) => {
    $('rwError').textContent = msg;
    $('rwError').hidden = false;
    form.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' },
      { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 320 });
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = $('rwUser').value.trim();
    const password = $('rwPass').value;
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) return fail('ENTER A VALID MINECRAFT USERNAME.');
    $('rwError').hidden = true;
    $('rwEnter').disabled = true;
    $('rwEnter').textContent = '…';
    try {
      const res = await fetch('api/runway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        cache: 'no-store',
      });
      $('rwPass').value = '';
      if (res.status === 401) return fail('ACCESS DENIED.');
      if (!res.ok) return fail('RUNWAY® IS CLOSED RIGHT NOW.');
      const { looks, preview } = await res.json();
      const [skin, textures] = await Promise.all([window.GoodApp.skinForName(name), Promise.all(looks.map(decode))]);
      close();
      unveil(name, skin, looks.map((l, i) => ({ ...l, texture: textures[i] })), !!preview);
    } catch (err) {
      fail(err && err.message && /^[A-Z]/.test(err.message) ? err.message : 'SOMETHING WENT WRONG. TRY AGAIN.');
    } finally {
      $('rwEnter').disabled = false;
      $('rwEnter').textContent = 'ENTER';
    }
  };

  // Looks arrive XOR-scrambled; decode straight to pixels (no image URL).
  async function decode({ k, d }) {
    const key = Uint8Array.from(atob(k), (c) => c.charCodeAt(0));
    const bytes = Uint8Array.from(atob(d), (c, i) => c.charCodeAt(0) ^ key[i % key.length]);
    const bmp = await createImageBitmap(new Blob([bytes]));
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    return ctx.getImageData(0, 0, c.width, c.height);
  }

  // ---------- Reveal ----------
  const blue = document.createElement('div');
  blue.className = 'rw-blue';
  document.body.appendChild(blue);
  let stage = null;
  let viewers = [];

  function pageItems() {
    return PAGE_ITEMS.flatMap((s) => [...document.querySelectorAll(s)]);
  }

  // Each element flies away from the centre of the screen (and back again).
  let awayAnims = [];
  function scatter(out) {
    const cx = innerWidth / 2, cy = innerHeight / 2;
    return Promise.all(pageItems().map((el, i) => {
      const r = el.getBoundingClientRect();
      const dx = (r.left + r.width / 2 - cx) * 1.6 || (i % 2 ? 400 : -400);
      const dy = (r.top + r.height / 2 - cy) * 1.6;
      const away = { transform: `translate(${dx}px, ${dy}px) scale(0.6) rotate(${i % 2 ? 4 : -4}deg)`, opacity: 0 };
      const home = { transform: 'none', opacity: 1 };
      const a = el.animate(out ? [home, away] : [away, home], {
        duration: 900, delay: i * 50, easing: out ? EASE_IN : EASE_OUT, fill: 'forwards',
      });
      if (out) awayAnims.push(a);
      else el.style.visibility = '';
      return a.finished.then(() => {
        if (out) el.style.visibility = 'hidden';
        else a.cancel();
      });
    })).then(() => {
      if (!out) { awayAnims.forEach((a) => a.cancel()); awayAnims = []; }
    });
  }

  async function unveil(name, skin, looks, preview) {
    document.body.classList.add('rw-on');
    const scattering = scatter(true);
    blue.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1400, delay: 300, easing: 'ease-in-out', fill: 'forwards' });
    await scattering;
    buildStage(name, skin, looks, preview);
  }

  // preview = view-only: no downloads, PREVIEW MODE shown throughout.
  function buildStage(name, skin, looks, preview) {
    const autoTone = SkinLib.sampleSkinTone(skin);
    const hairRows = SkinLib.estimateHairRows(skin, autoTone);
    stage = document.createElement('section');
    stage.className = 'rw-stage';
    stage.innerHTML = `
      <header class="rw-head">
        <button type="button" class="rw-back mono">← BACK</button>
        <div class="rw-title">RUNWAY®</div>
        <div class="rw-who mono">${name.toUpperCase()}</div>
      </header>
      <div class="rw-tone mono">
        <span>SKIN TONE</span>
        <label class="rw-swatch" title="Pick a colour"><input type="color" aria-label="Skin tone"><span></span></label>
        <button type="button" class="rw-auto" aria-pressed="true">AUTO</button>
      </div>
      ${preview ? '<div class="rw-preview mono">PREVIEW MODE · VIEW ONLY</div>' : ''}
      <div class="rw-looks"></div>
      <p class="rw-legal mono">© ${new Date().getFullYear()} GOOD® DESIGN. RUNWAY® LOOKS ARE PROTECTED WORKS OF GOOD®. ALL RIGHTS RESERVED.</p>`;
    if (preview) {
      stage.classList.add('is-preview');
      stage.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    document.body.appendChild(stage);
    stage.querySelector('.rw-back').onclick = leave;

    // Skin tone override: AUTO samples it from the player's skin; the swatch
    // picks one by hand (e.g. when white hair gets read as skin).
    const toHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
    const toneInput = stage.querySelector('.rw-swatch input');
    const toneDot = stage.querySelector('.rw-swatch span');
    const autoBtn = stage.querySelector('.rw-auto');
    const drawn = [];
    const paint = (tone) => {
      toneInput.value = toHex(tone);
      toneDot.style.background = toHex(tone);
      for (const d of drawn) {
        const merged = SkinLib.mergeSkin(skin, d.texture, tone, d.slim, d.slim ? hairRows : 0, null, 'auto');
        d.tex.getContext('2d').putImageData(new ImageData(merged.data, 64, 64), 0, 0);
        if (d.viewer) d.viewer.loadSkin(d.tex, { model: d.slim ? 'slim' : 'default' });
        else { const c = d.flat.getContext('2d'); c.clearRect(0, 0, 64, 64); c.drawImage(d.tex, 0, 0); }
      }
    };
    toneInput.oninput = () => {
      const v = toneInput.value;
      autoBtn.setAttribute('aria-pressed', 'false');
      paint([1, 3, 5].map((k) => parseInt(v.slice(k, k + 2), 16)));
    };
    autoBtn.onclick = () => {
      autoBtn.setAttribute('aria-pressed', 'true');
      paint(autoTone);
    };

    const row = stage.querySelector('.rw-looks');
    looks.forEach((look, i) => {
      const slim = SkinLib.detectSlim(look.texture);
      const tex = document.createElement('canvas');
      tex.width = tex.height = 64;
      const d = { texture: look.texture, slim, tex };
      drawn.push(d);

      const col = document.createElement('article');
      col.className = 'rw-look';
      col.innerHTML = `
        <div class="rw-view"></div>
        <div class="rw-name">${look.name}</div>
        ${preview
          ? '<button type="button" class="rw-access" disabled>PREVIEW ONLY</button>'
          : '<button type="button" class="rw-access">ACCESS® LOOK</button>'}
        <p class="rw-note mono">${slim ? 'SLIM (ALEX)' : 'CLASSIC (STEVE)'} MODEL</p>`;
      row.appendChild(col);

      const view = col.querySelector('.rw-view');
      if (window.skinview3d) {
        const v = new skinview3d.SkinViewer({ canvas: document.createElement('canvas'), width: view.clientWidth || 240, height: view.clientHeight || 360 });
        v.animation = new skinview3d.IdleAnimation();
        v.zoom = 0.8;
        view.appendChild(v.canvas);
        viewers.push(v);
        d.viewer = v;
      } else {
        const img = document.createElement('canvas');
        img.width = img.height = 64;
        img.className = 'rw-flat';
        view.appendChild(img);
        d.flat = img;
      }
      if (!preview) col.querySelector('.rw-access').onclick = () => {
        const a = document.createElement('a');
        a.href = tex.toDataURL('image/png');
        a.download = `${name.replace(/[^A-Za-z0-9_]/g, '')}GOOD.png`;
        a.click();
      };

      // Outer looks slide in from their side; the middle one rises.
      const from = i === 0 ? 'translateX(-110vw)' : i === looks.length - 1 ? 'translateX(110vw)' : 'translateY(60vh)';
      col.animate([{ transform: from, opacity: 0 }, { transform: 'none', opacity: 1 }], {
        duration: 1100, delay: 150 + i * 180, easing: EASE_OUT, fill: 'backwards',
      });
    });
    paint(autoTone);
    stage.querySelector('.rw-head').animate([{ opacity: 0, transform: 'translateY(-20px)' }, { opacity: 1, transform: 'none' }],
      { duration: 700, delay: 700, easing: EASE_OUT, fill: 'backwards' });
  }

  async function leave() {
    if (!stage) return;
    const s = stage;
    stage = null;
    await s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).finished;
    viewers.forEach((v) => v.dispose());
    viewers = [];
    s.remove();
    blue.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-in-out', fill: 'forwards' });
    await scatter(false);
    document.body.classList.remove('rw-on');
  }

  // Opened from the RUNWAY® link in the header.
  document.getElementById('navRunway').onclick = open;
  window.GoodRunway = { open };
})();
