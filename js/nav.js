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

// You, in the nav: a pill with your face, name and GOOD® COINS once you're signed in, SIGN IN
// (as words) before. Page scripts that already have the account call GoodNav.update(me);
// pass fresh = true after the home skin changes.
(() => {
  const links = [...document.querySelectorAll('[data-acct]')];
  if (!links.length) return;
  const BLANK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect width="16" height="16" fill="currentColor" opacity="0.18"/><rect x="5" y="3" width="6" height="6" fill="currentColor" opacity="0.55"/><path d="M2 16V14q0-3 3-3h6q3 0 3 3v2" fill="currentColor" opacity="0.55"/></svg>';
  let face = null, faceFor = null;
  const span = (cls, t) => { const e = document.createElement('span'); e.className = cls; e.textContent = t; return e; };
  const paint = (me) => links.forEach((a) => {
    a.classList.add('nav-acct'); a.classList.toggle('in', !!me);
    a.setAttribute('aria-label', me ? `${me.name}: your account, ${me.coins} GOOD® COINS` : 'Sign in');
    a.removeAttribute('title');
    if (!me) { a.textContent = 'SIGN IN'; return; }
    let pic;
    if (face) {
      pic = document.createElement('canvas'); pic.width = pic.height = 8; pic.setAttribute('aria-hidden', 'true');
      pic.getContext('2d').drawImage(face, 0, 0);
    } else { const t = document.createElement('template'); t.innerHTML = BLANK; pic = t.content.firstChild; }
    a.replaceChildren(pic, span('na-name', me.name), span('na-coins', `${me.coins ?? 0} COINS`));
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
  (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null }))).then((j) => update(j.user));
})();

// GOOD® CASINO: a chip in the bottom-left corner of every page (not on /casino itself, not over
// MAKER®'s phone sheet). Its styles come with it, so no page needs new CSS.
(() => {
  if (/^\/casino/.test(location.pathname) || document.querySelector('.casino-chip')) return;
  const css = document.createElement('style');
  css.textContent = `.casino-chip { position: fixed; left: 22px; bottom: 22px; z-index: 440; width: 52px; height: 52px; display: block; border-radius: 50%;
      filter: drop-shadow(0 6px 14px rgba(0, 0, 60, 0.35)); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
    .casino-chip:hover, .casino-chip:focus-visible { transform: rotate(45deg) scale(1.06); outline: none; }
    .casino-chip svg { width: 100%; height: 100%; display: block; }
    @media (max-width: 700px) { .casino-chip { left: 14px; bottom: 14px; width: 44px; height: 44px; }
      .m-stage > .casino-chip { position: absolute; left: 12px; bottom: 30px; width: 50px; height: 50px; } body.m-maker.m-open .m-stage > .casino-chip { width: 40px; height: 40px; bottom: 26px; } }
    @media print { .casino-chip { display: none; } }`;
  document.head.append(css);
  const a = document.createElement('a');
  a.className = 'casino-chip'; a.href = '/casino'; a.setAttribute('aria-label', 'GOOD® CASINO'); a.title = 'GOOD® CASINO';
  a.innerHTML = window.GoodChip || (window.GoodChip = '<svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="27" fill="#fff"/>'
    + '<circle cx="28" cy="28" r="22" fill="none" stroke="#0000ff" stroke-width="6" stroke-dasharray="5.76 5.76"/>'
    + '<circle cx="28" cy="28" r="14" fill="#0000ff"/>'
    + '<path d="M28 19c3 4 8 6 8 10.5 0 2.6-2 4.4-4.3 4.4-1.4 0-2.5-.6-3.1-1.5.3 2 1 3.4 2.2 4.6h-5.6c1.2-1.2 1.9-2.6 2.2-4.6-.6.9-1.7 1.5-3.1 1.5-2.3 0-4.3-1.8-4.3-4.4C20 25 25 23 28 19z" fill="#fff"/></svg>');
  // MAKER® on a phone: on the stage, across from the download button, not over the piece sheet.
  const phone = matchMedia('(max-width: 700px)');
  const place = () => { const st = phone.matches && document.querySelector('.m-stage'); (st || document.body).append(a); };
  place(); addEventListener('load', place); phone.addEventListener('change', place);
})();
