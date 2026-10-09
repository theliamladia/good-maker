// GOOD® ACCOUNT page: sign in by email link; signed in, the home skin, the
// GOOD® COINS and the WARDROBE, each fit drawn on your home skin. Clicking a
// fit opens it in THE MAKER (your home skin loads there automatically).
(() => {
  const $ = (id) => document.getElementById(id);
  const DEMO = 'samples/spurdo.png';
  const post = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || r.status), { code: j.error });
    return j;
  };
  let toastT;
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); };
  const lookHref = (L) => `./?${new URLSearchParams(L)}`;

  let me = null, wardrobe = [], skin = null;

  function card(w) {
    const a = document.createElement('a');
    a.className = 'ac-card'; a.href = lookHref(w.look); a.hidden = true;
    a.innerHTML = '<span class="ac-fig"></span><span class="ac-piece"></span><span class="ac-cw mono"></span><button type="button" class="ac-x mono" aria-label="Remove from wardrobe">×</button>';
    a.querySelector('.ac-x').onclick = async (e) => {
      e.preventDefault(); e.stopPropagation();
      await post('api/me', { action: 'remove', id: w.id }).catch(() => {});
      wardrobe = wardrobe.filter((v) => v !== w); a.remove(); count();
    };
    GoodCompose.compose(skin, w.look).then(({ merged, slim, top, bottom }) => {
      a.querySelector('.ac-fig').append(GoodCompose.front(merged, slim));
      a.querySelector('.ac-piece').textContent = [top && top.name, bottom && bottom.name].filter(Boolean).join(' + ');
      a.querySelector('.ac-cw').textContent = [top && top.color, bottom && bottom.color].filter(Boolean).join(' / ');
      a.setAttribute('aria-label', `${[GoodCompose.label(top), GoodCompose.label(bottom)].filter(Boolean).join(' and ')}. Open in THE MAKER.`);
      a.hidden = false;
    }).catch(() => a.remove());   // a retired piece
    return a;
  }
  const count = () => { $('wCount').textContent = `${wardrobe.length} / 60`; $('wEmpty').hidden = wardrobe.length > 0; };

  async function render() {
    $('out').hidden = !!me; $('in').hidden = !me;
    document.querySelectorAll('[data-acct]').forEach((a) => { a.textContent = me ? `${me.name} · ` : 'SIGN IN'; if (me) { const c = document.createElement('span'); c.className = 'coin'; c.setAttribute('aria-hidden', 'true'); a.append(c, String(me.coins)); a.setAttribute('aria-label', `${me.name}, ${me.coins} GOOD® COINS`); } });
    if (!me) return;
    $('name').textContent = me.name;
    $('coins').textContent = me.coins;
    try { skin = me.hasSkin ? await GoodCompose.load(`api/me?skin=1&t=${Date.now()}`) : await GoodCompose.load(DEMO); } catch { skin = await GoodCompose.load(DEMO); }
    $('homeCap').textContent = me.hasSkin ? 'HOME SKIN' : 'NO HOME SKIN YET · SAVE ONE IN THE MAKER';
    const fig = $('homeFig'); fig.replaceChildren();
    if (me.hasSkin) fig.append(GoodCompose.front({ data: skin.data }, SkinLib.detectSlim(skin)));
    $('grid').replaceChildren(...wardrobe.map(card));
    count();
  }

  $('form').onsubmit = async (e) => {
    e.preventDefault();
    $('msg').textContent = 'SENDING…';
    try { await post('api/auth', { action: 'request', email: $('email').value }); $('msg').textContent = 'CHECK YOUR EMAIL. NOT THERE? PLEASE CHECK YOUR SPAM FOLDER. THE LINK WORKS FOR 15 MINUTES.'; }
    catch (err) { $('msg').textContent = err.code === 'email_not_configured' ? 'SIGN-IN OPENS SOON.' : err.code === 'email' ? 'THAT EMAIL DOESN’T LOOK RIGHT.' : err.code === 'slow_down' ? 'SLOW DOWN. TRY AGAIN IN A MINUTE.' : 'COULDN’T SEND. TRY AGAIN.'; }
  };
  $('signout').onclick = async () => { await post('api/auth', { action: 'logout' }).catch(() => {}); me = null; render(); };
  $('rename').onclick = async () => {
    const n = prompt('Your GOOD® name (shown on your comments):', me.name);
    if (!n) return;
    try { const j = await post('api/me', { action: 'name', name: n }); me.name = j.name; render(); } catch { toast('2 TO 16 LETTERS OR NUMBERS.'); }
  };
  $('delete').onclick = async () => {
    if (!confirm('Delete your GOOD® account, home skin, wardrobe and GOOD® COINS? This can’t be undone.')) return;
    await post('api/me', { action: 'delete' }).catch(() => {});
    me = null; render(); toast('ACCOUNT DELETED.');
  };

  const q = new URLSearchParams(location.search);
  const signin = q.get('signin');
  if (signin) history.replaceState(null, '', location.pathname);
  fetch('api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })).then((j) => {
    me = j.user; wardrobe = j.wardrobe || [];
    render();
    if (signin === 'ok' && me) toast(`SIGNED IN AS ${me.name}.`);
    if (signin === 'expired') toast('THAT LINK EXPIRED. ASK FOR A NEW ONE.');
  });
})();
