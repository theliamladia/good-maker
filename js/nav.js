// Mobile nav: on small screens the header links fold into a hamburger menu
// (the button is hidden on wider screens by CSS). Works for the site header
// (.site-nav) and STUDY®'s (.st-nav).
(() => {
  const nav = document.querySelector('.site-nav, .st-nav');
  if (!nav) return;
  const header = nav.parentElement;
  nav.id ||= 'mainNav';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-burger';
  btn.setAttribute('aria-controls', nav.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  header.insertBefore(btn, nav);
  const set = (open) => {
    header.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  };
  btn.onclick = (e) => { e.stopPropagation(); set(!header.classList.contains('nav-open')); };
  nav.addEventListener('click', (e) => { if (e.target.closest('a, button')) set(false); });
  document.addEventListener('click', (e) => { if (!header.contains(e.target)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('nav-open')) { set(false); btn.focus(); } });
  matchMedia('(min-width: 701px)').addEventListener('change', (m) => { if (m.matches) set(false); });
})();

// ACCOUNT in the nav is an avatar, not words: a blank profile until you sign in,
// then your own face (from your home skin). Page scripts that already have the
// account call GoodNav.update(me); pass fresh = true after the home skin changes.
(() => {
  const links = [...document.querySelectorAll('[data-acct]')];
  if (!links.length) return;
  const BLANK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="0.5" y="0.5" width="15" height="15" fill="none" stroke="currentColor"/><rect x="5" y="3" width="6" height="6" fill="currentColor" opacity="0.55"/><path d="M2 15.5V14q0-3 3-3h6q3 0 3 3v1.5" fill="currentColor" opacity="0.55"/></svg>';
  let face = null, faceFor = null;
  const paint = (me) => links.forEach((a) => {
    a.classList.add('nav-avatar');
    a.setAttribute('aria-label', me ? `${me.name}: account, ${me.coins} GOOD® COINS` : 'Sign in');
    a.title = me ? `${me.name} · ${me.coins} GOOD® COINS` : 'SIGN IN';
    if (me && face) {
      const c = document.createElement('canvas'); c.width = c.height = 8; c.setAttribute('aria-hidden', 'true');
      c.getContext('2d').drawImage(face, 0, 0); a.replaceChildren(c);
    } else a.innerHTML = BLANK;
  });
  async function update(me, fresh) {
    if (me && me.hasSkin && (fresh || faceFor !== me.name || !face)) {
      try {
        const r = await fetch('/api/me?skin=1', { cache: 'no-store' });
        if (r.ok) {
          const bmp = await createImageBitmap(await r.blob());
          const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d');
          x.drawImage(bmp, 8, 8, 8, 8, 0, 0, 8, 8);                        // the face
          if (bmp.height >= 64 || bmp.width >= 64) x.drawImage(bmp, 40, 8, 8, 8, 0, 0, 8, 8);   // and its hat layer
          face = c; faceFor = me.name;
        }
      } catch { face = null; }
    }
    if (!me || !me.hasSkin) face = null;
    paint(me);
  }
  window.GoodNav = { update };
  paint(null);
  (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null }))).then((j) => update(j.user));
})();
