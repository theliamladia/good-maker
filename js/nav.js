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
