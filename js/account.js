// GOOD® ACCOUNT in THE MAKER: the nav shows your name and GOOD® COINS; signed
// in, SAVE HOME SKIN / USE HOME SKIN sit under YOUR SKIN and your home skin
// loads on every visit; SAVE TO WARDROBE stores the fit (+10 GOOD® COINS a
// each for the first 2 new fits a day). Signing in and the wardrobe itself live on account.html.
(() => {
  const $ = (id) => document.getElementById(id);
  const app = () => window.GoodApp;
  let me = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  const post = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || r.status), { code: j.error });
    return j;
  };
  let toastT;
  function toast(msg) {
    const t = $('acctToast'); t.textContent = msg; t.hidden = false;
    if (/GOOD® COINS/.test(msg)) { const c = document.createElement('span'); c.className = 'coin'; c.setAttribute('aria-hidden', 'true'); t.prepend(c); }
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
  }
  function draw() {
    $('acctBtn').innerHTML = me ? `${esc(me.name)} · <span class="coin" aria-hidden="true"></span>${me.coins}` : 'SIGN IN';
    $('acctBtn').setAttribute('aria-label', me ? `${me.name}, ${me.coins} GOOD® COINS` : 'Sign in');
    $('homeSkin').hidden = !me;
    if (me) $('homeUse').hidden = !me.hasSkin;
  }

  // ---------- Home skin ----------
  function skinPng() {
    const cur = app() && app().current();
    if (!cur || !cur.skin || cur.isDemo) return null;
    const c = document.createElement('canvas'); c.width = cur.skin.width; c.height = cur.skin.height;
    c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(cur.skin.data), cur.skin.width, cur.skin.height), 0, 0);
    return c.toDataURL('image/png').split(',')[1];
  }
  $('homeSave').onclick = async () => {
    const png = skinPng();
    if (!png) { toast('LOAD YOUR SKIN FIRST (UPLOAD OR USERNAME).'); return; }
    try { await post('api/me', { action: 'skin', png }); me.hasSkin = true; draw(); toast('HOME SKIN SAVED. IT LOADS EVERY TIME YOU VISIT.'); }
    catch { toast('COULDN’T SAVE YOUR SKIN. TRY AGAIN.'); }
  };
  async function useHome() {
    try { app().useHomeSkin(await app().loadSkinUrl(`api/me?skin=1&t=${Date.now()}`), me.name); } catch { /* none yet */ }
  }
  $('homeUse').onclick = useHome;

  // ---------- Wardrobe ----------
  $('saveLook').onclick = async () => {
    if (!me) { location.href = 'account'; return; }
    try {
      const j = await post('api/me', { action: 'save', look: app().currentLook() });
      if (j.duplicate) { toast('ALREADY IN YOUR WARDROBE.'); return; }
      me.coins = j.coins; draw();
      toast(j.earned ? `SAVED TO YOUR WARDROBE. +${j.earned} GOOD® COINS` : j.capped ? 'SAVED. YOU’VE EARNED TODAY’S GOOD® COINS (2 FITS). BACK TOMORROW FOR MORE.' : 'SAVED TO YOUR WARDROBE.');
    } catch (e) {
      toast(e.code === 'full' ? 'WARDROBE FULL (60). REMOVE ONE ON YOUR ACCOUNT PAGE.' : e.code === 'look' ? 'PUT ON A TOP OR BOTTOM FIRST.' : 'COULDN’T SAVE. TRY AGAIN.');
    }
  };

  // ---------- Minecraft stand ----------
  // Signs the finished skin (via /api/stand) and hands back a code for the
  // GoodStands plugin: /goodstand npc <code>.
  $('mcStand').onclick = async () => {
    if (!me) { location.href = 'account'; return; }
    const s = app().standSkin();
    if (!s) { toast('PUT ON A FIT YOU CAN DOWNLOAD FIRST.'); return; }
    const b = $('mcStand'), label = b.firstChild.textContent;
    b.disabled = true; b.firstChild.textContent = 'SIGNING THE SKIN… ';
    try {
      const { code } = await post('api/stand', s);
      try { await navigator.clipboard.writeText(`/goodstand npc ${code}`); } catch { /* no clipboard */ }
      b.querySelector('span').textContent = `/goodstand npc ${code}`;
      toast(`STAND CODE ${code} · COPIED: /goodstand npc ${code}`);
    } catch (e) {
      toast(e.code === 'slow_down' || e.code === 'mineskin' ? 'THE SKIN SIGNER IS BUSY. TRY AGAIN IN A MINUTE.' : e.code === 'signed_out' ? 'SIGN IN FIRST.' : 'COULDN’T MAKE A STAND CODE. TRY AGAIN.');
    } finally { b.disabled = false; b.firstChild.textContent = label; }
  };

  // ---------- Boot ----------
  fetch('api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })).then(async (j) => {
    me = j.user; draw();
    if (me && me.unlocks && me.unlocks.length && app()) app().unlock(me.unlocks);
    // Signed in with a home skin: it loads automatically (unless a shared look named a player).
    if (me && me.hasSkin && app() && !app().linked) { await app().whenBooted(); useHome(); }
  });
})();
