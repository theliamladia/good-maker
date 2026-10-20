// GOOD® ACCOUNT in MAKER®: the nav shows your name and GOOD® COINS; signed
// in, SAVE HOME SKIN / USE HOME SKIN sit under YOUR SKIN and your home skin
// loads on every visit; SAVE TO WARDROBE stores the fit (+10 GOOD® COINS a
// each for the first 2 new fits a day). Signing in and the wardrobe itself live on account.html.
(() => {
  // One /api/me per page load, shared by every script that needs it.
  const meOnce = () => (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })));
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
    window.GoodNav?.update(me);
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
    try { await post('api/me', { action: 'skin', png }); me.hasSkin = true; draw(); window.GoodNav?.update(me, true); toast('HOME SKIN SAVED. IT LOADS EVERY TIME YOU VISIT.'); }
    catch { toast('COULDN’T SAVE YOUR SKIN. TRY AGAIN.'); }
  };
  async function useHome() {
    try { app().useHomeSkin(await app().loadSkinUrl(`api/me?skin=1&t=${Date.now()}`), me.name); } catch { /* none yet */ }
  }
  $('homeUse').onclick = useHome;

  // ---------- Saved settings ----------
  // MAKER® calls this (debounced) whenever the fit, body or MY SKIN changes.
  let prefsT;
  window.GoodAccount = {
    savePrefs(p) {
      if (!me) return;
      clearTimeout(prefsT);
      prefsT = setTimeout(() => post('api/me', { action: 'prefs', prefs: p }).catch(() => {}), 2500);
    },
  };

  // ---------- GOOD® COINS today ----------
  // Under SAVE TO WARDROBE: how many coin saves are left today, or when they come back.
  let dailyT;
  const pad = (n) => String(n).padStart(2, '0');
  function drawDaily() {
    clearTimeout(dailyT);
    const span = $('saveLook').querySelector('span');
    const coin = '<span class="coin" aria-hidden="true"></span>';
    if (!me || !me.daily) { span.innerHTML = `${coin}+10 GOOD® COINS · 4 FITS A DAY`; return; }
    const d = me.daily;
    if (d.left > 0) { span.innerHTML = `${coin}SAVE ${d.left} MORE NEW FIT${d.left > 1 ? 'S' : ''} TODAY FOR +${d.coins} EACH`; return; }
    const ms = Date.parse(d.resetsAt) - Date.now();
    if (ms <= 0) { d.left = d.per; drawDaily(); return; }
    const t = Math.floor(ms / 1000);
    span.innerHTML = `${coin}MORE GOOD® COINS IN ${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
    dailyT = setTimeout(drawDaily, 1000 - (Date.now() % 1000));
  }

  // ---------- Wardrobe ----------
  $('saveLook').onclick = async () => {
    if (!me) { location.href = 'account'; return; }
    try {
      const j = await post('api/me', { action: 'save', look: app().savedLook ? app().savedLook() : app().currentLook() });
      if (j.daily) { me.daily = j.daily; drawDaily(); }
      if (j.duplicate) { toast('ALREADY IN YOUR WARDROBE.'); return; }
      me.coins = j.coins; draw();
      toast(j.earned ? `SAVED TO YOUR WARDROBE. +${j.earned} GOOD® COINS` : j.capped ? 'SAVED. YOU’VE EARNED TODAY’S GOOD® COINS (4 FITS). BACK TOMORROW FOR MORE.' : 'SAVED TO YOUR WARDROBE.');
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
  meOnce().then(async (j) => {
    me = j.user; draw(); drawDaily();
    if (me && me.unlocks && me.unlocks.length && app()) app().unlock(me.unlocks);
    // The owner's own pieces, before the saved settings (they may be wearing one).
    if (me && me.owner && app() && app().addPrivate) {
      const cat = await fetch('api/outfit?private=1', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (cat) { await app().whenBooted(); await app().addPrivate(cat); }
    }
    // The account's saved settings win over this browser's (a shared link's fit still wins).
    if (me && me.prefs && app()) { await app().whenBooted(); await app().applyPrefs(me.prefs); }
    // Signed in with a home skin: it loads automatically (unless a shared look named a player).
    if (me && me.hasSkin && app() && !app().linked) { await app().whenBooted(); useHome(); }
  });
})();
