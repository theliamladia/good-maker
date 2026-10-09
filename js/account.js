// GOOD® ACCOUNT in THE MAKER: email sign-in link, home skin, wardrobe and
// GOOD® COINS (+10 for every new fit saved). Talks to api/auth.js and api/me.js;
// the session is an HttpOnly cookie, so nothing about it is readable here.
(() => {
  const $ = (id) => document.getElementById(id);
  const app = () => window.GoodApp;
  const modal = $('acct');
  let me = null, wardrobe = [];

  const post = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || r.status), { code: j.error, status: r.status });
    return j;
  };
  let toastT;
  function toast(msg) {
    const t = $('acctToast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- Names for a saved look ----------
  const name = (id, list) => {
    for (const k of list) for (const c of k.colors || [k]) if (c.id === id) return `${k.name}${c.color ? ' ' + c.color : ''}`;
    return id;
  };
  const describe = (L) => [L.top && name(L.top, window.OUTFITS), L.bottom && name(L.bottom, window.PANTS)].filter(Boolean).join(' + ');

  // ---------- State ----------
  function draw() {
    const signed = !!me;
    $('acctBtn').textContent = signed ? `${me.name} · ${me.coins} GOOD® COINS` : 'SIGN IN';
    $('acctOut').hidden = signed; $('acctIn').hidden = !signed;
    $('homeSkin').hidden = !signed;
    $('saveLook').hidden = false;
    if (!signed) return;
    $('homeUse').hidden = !me.hasSkin;
    $('acctName').textContent = me.name;
    $('acctCoins').textContent = me.coins;
    $('acctEmpty').hidden = wardrobe.length > 0;
    $('acctWardrobe').replaceChildren(...wardrobe.map((w) => {
      const li = document.createElement('li');
      const t = document.createElement('span'); t.className = 'acct-w-name'; t.textContent = describe(w.look);
      const on = document.createElement('button'); on.type = 'button'; on.className = 'acct-go mono'; on.textContent = 'PUT ON';
      on.onclick = () => { app().applyLook(w.look); close(); };
      const x = document.createElement('button'); x.type = 'button'; x.className = 'acct-link mono'; x.textContent = 'REMOVE'; x.setAttribute('aria-label', `Remove ${t.textContent}`);
      x.onclick = async () => { await post('api/me', { action: 'remove', id: w.id }).catch(() => {}); wardrobe = wardrobe.filter((v) => v !== w); draw(); };
      li.append(t, on, x);
      return li;
    }));
  }
  async function refresh() {
    try {
      const r = await fetch('api/me');
      if (!r.ok) throw new Error();
      const j = await r.json();
      me = j.user; wardrobe = j.wardrobe || [];
    } catch { me = null; wardrobe = []; }
    draw();
  }

  // ---------- Home skin ----------
  function skinPng() {
    const cur = app() && app().current();
    if (!cur || !cur.skin || cur.isDemo) return null;
    const c = document.createElement('canvas'); c.width = cur.skin.width; c.height = cur.skin.height;
    c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(cur.skin.data), cur.skin.width, cur.skin.height), 0, 0);
    return c.toDataURL('image/png').split(',')[1];
  }
  async function saveHome(msgEl) {
    const png = skinPng();
    if (!png) { (msgEl ? (msgEl.textContent = 'LOAD YOUR SKIN FIRST (UPLOAD OR USERNAME).') : toast('LOAD YOUR SKIN FIRST.')); return; }
    try {
      await post('api/me', { action: 'skin', png });
      me.hasSkin = true; draw();
      toast('HOME SKIN SAVED. IT LOADS EVERY TIME YOU SIGN IN.');
      if (msgEl) msgEl.textContent = '';
    } catch { toast('COULDN’T SAVE YOUR SKIN. TRY AGAIN.'); }
  }
  async function useHome() {
    try {
      const data = await app().loadSkinUrl(`api/me?skin=1&t=${Date.now()}`);
      app().useHomeSkin(data, me.name);
    } catch { /* no home skin yet */ }
  }
  $('homeSave').onclick = () => saveHome();
  $('homeUse').onclick = useHome;
  $('acctHome').onclick = () => saveHome($('acctMsg2'));

  // ---------- Wardrobe ----------
  $('saveLook').onclick = async () => {
    if (!me) { open(); $('acctMsg').textContent = 'SIGN IN TO SAVE FITS AND EARN GOOD® COINS.'; return; }
    try {
      const j = await post('api/me', { action: 'save', look: app().currentLook() });
      if (j.duplicate) { toast('ALREADY IN YOUR WARDROBE.'); return; }
      wardrobe.unshift(j.item); me.coins = j.coins; draw();
      toast(j.earned ? `SAVED. +${j.earned} GOOD® COINS` : 'SAVED TO YOUR WARDROBE.');
    } catch (e) {
      toast(e.code === 'full' ? 'WARDROBE FULL (60). REMOVE ONE FIRST.' : e.code === 'look' ? 'PUT ON A TOP OR BOTTOM FIRST.' : 'COULDN’T SAVE. TRY AGAIN.');
    }
  };

  // ---------- Sign in / out ----------
  function open() { modal.hidden = false; if (app()) app().setModalOpen(true); (me ? $('acctHome') : $('acctEmail')).focus(); }
  function close() { modal.hidden = true; if (app()) app().setModalOpen(false); }
  $('acctBtn').onclick = open;
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  $('acctForm').onsubmit = async (e) => {
    e.preventDefault();
    const msg = $('acctMsg');
    msg.textContent = 'SENDING…';
    try {
      await post('api/auth', { action: 'request', email: $('acctEmail').value });
      msg.textContent = 'CHECK YOUR EMAIL. THE LINK WORKS FOR 15 MINUTES.';
    } catch (err) {
      msg.textContent = err.code === 'email_not_configured' ? 'SIGN-IN OPENS SOON.' : err.code === 'email' ? 'THAT EMAIL DOESN’T LOOK RIGHT.' : err.code === 'slow_down' ? 'SLOW DOWN. TRY AGAIN IN A MINUTE.' : 'COULDN’T SEND. TRY AGAIN.';
    }
  };
  $('acctOutBtn').onclick = async () => { await post('api/auth', { action: 'logout' }).catch(() => {}); me = null; wardrobe = []; draw(); close(); toast('SIGNED OUT.'); };
  $('acctRename').onclick = async () => {
    const n = prompt('Your GOOD® name (shown on your comments):', me.name);
    if (!n) return;
    try { const j = await post('api/me', { action: 'name', name: n }); me.name = j.name; draw(); } catch { toast('2 TO 16 LETTERS OR NUMBERS.'); }
  };
  $('acctDelete').onclick = async () => {
    if (!confirm('Delete your GOOD® account, home skin, wardrobe and GOOD® COINS? This can’t be undone.')) return;
    await post('api/me', { action: 'delete' }).catch(() => {});
    me = null; wardrobe = []; draw(); close(); toast('ACCOUNT DELETED.');
  };

  // ---------- Boot ----------
  const q = new URLSearchParams(location.search);
  const signin = q.get('signin');
  if (signin) { q.delete('signin'); history.replaceState(null, '', location.pathname + (q.toString() ? `?${q}` : '')); }
  refresh().then(async () => {
    if (signin === 'ok' && me) toast(`SIGNED IN AS ${me.name}.`);
    if (signin === 'expired') toast('THAT LINK EXPIRED. ASK FOR A NEW ONE.');
    // Signed in with a home skin: it loads automatically (unless a shared look named a player).
    if (me && me.hasSkin && app() && !app().linked) { await app().whenBooted(); useHome(); }
  });
})();
