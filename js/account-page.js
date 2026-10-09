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

  let me = null, wardrobe = [], skin = null, inventory = [], crateItems = {}, achievements = [];

  function card(w) {
    const a = document.createElement('a');
    a.className = 'ac-card'; a.href = lookHref(w.look); a.hidden = true;
    a.innerHTML = '<span class="ac-fig"></span><span class="ac-fit-title"></span><span class="ac-piece"></span><span class="ac-cw mono"></span><button type="button" class="ac-x mono" aria-label="Remove from wardrobe">×</button>';
    a.querySelector('.ac-fit-title').textContent = w.title || '';
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
      fits.set(w, [top, bottom]); story();
    }).catch(() => a.remove());   // a retired piece
    return a;
  }
  const count = () => { $('wCount').textContent = `${wardrobe.length} / 60`; $('wEmpty').hidden = wardrobe.length > 0; story(); };

  // YOUR COLOR STORY: every colour in the wardrobe's colourways (from COLORS®),
  // one bar each, as wide as how often it's worn. Most worn first.
  const COLORS = new Map((window.GOOD_COLORS || []).map((c) => [c.name, c]));
  const fits = new Map();   // wardrobe entry -> [top, bottom] once drawn
  function story() {
    const tally = new Map();
    for (const w of wardrobe) for (const piece of fits.get(w) || []) {
      for (const n of (piece && piece.palette) || String((piece && piece.color) || '').split('/')) {
        const c = COLORS.get(n.replace(/™/g, '').trim());
        if (c) tally.set(c, (tally.get(c) || 0) + 1);
      }
    }
    const rows = [...tally].sort((a, b) => b[1] - a[1]);
    $('story').hidden = !rows.length;
    const total = rows.reduce((a, [, n]) => a + n, 0);
    const label = (c) => (c.mark ? `${c.name}${c.mark}` : c.pantone || c.name.includes('®') ? c.name : `${c.name}™`);
    $('storyStrip').replaceChildren(...rows.map(([c, n]) => {
      const b = document.createElement('span');
      const h = Array.isArray(c.hex) ? c.hex : [c.hex];
      b.className = 'ac-story-bar'; b.setAttribute('role', 'listitem');
      b.style.setProperty('--n', n);
      b.style.background = h.length > 1 ? `linear-gradient(to bottom, ${h[0]} 50%, ${h[1]} 50%)` : h[0];
      const text = `${label(c)} · ${Math.round((n / total) * 100)}%`;
      b.setAttribute('aria-label', text); b.title = text;
      b.onmouseenter = () => { $('storyRead').textContent = text; };
      return b;
    }));
    $('storyStrip').onmouseleave = () => { $('storyRead').innerHTML = '&nbsp;'; };
  }

  async function render() {
    $('out').hidden = !!me; $('in').hidden = !me;
    document.querySelectorAll('[data-acct]').forEach((a) => { a.textContent = me ? `${me.name} · ` : 'SIGN IN'; if (me) { const c = document.createElement('span'); c.className = 'coin'; c.setAttribute('aria-hidden', 'true'); a.append(c, String(me.coins)); a.setAttribute('aria-label', `${me.name}, ${me.coins} GOOD® COINS`); } });
    if (!me) return;
    $('name').textContent = me.name;
    if (me.owner) { const b = document.createElement('span'); b.className = 'mb-admin mono'; b.textContent = 'ADMIN'; $('name').append(b); }
    $('coins').textContent = me.coins;
    if (me.profile) { $('profileLink').hidden = false; $('profileLink').href = `/profiles/${me.profile}`; $('profileLink').textContent = `PUBLIC PROFILE: GOOD.LEEMS.ME/PROFILES/${me.profile.toUpperCase()} →`; } else $('profileLink').hidden = true;
    try { skin = me.hasSkin ? await GoodCompose.load(`api/me?skin=1&t=${Date.now()}`) : await GoodCompose.load(DEMO); } catch { skin = await GoodCompose.load(DEMO); }
    GoodHeads.draw($('avatar'), me.hasSkin ? `api/me?skin=1&t=${Date.now()}` : null);
    $('grid').replaceChildren(...wardrobe.map(card));
    count();
    drawInventory();
    drawAchievements();
  }

  // MY INVENTORY®: every GOOD® CRATE pull, newest first, the piece alone with its serial.
  function drawInventory() {
    $('iCount').textContent = `${inventory.length} ${inventory.length === 1 ? 'PIECE' : 'PIECES'}`;
    $('iEmpty').hidden = inventory.length > 0;
    $('invReset').hidden = !(me && me.owner && inventory.some((e) => e.serial !== 'GD-999'));
    $('inv').replaceChildren(...inventory.map((e) => {
      const it = crateItems[e.item] || { id: e.item, name: e.item.toUpperCase(), color: '' };
      const el = document.createElement('div');
      el.className = `ac-card${it.tier === 'gold' || it.tier === 'ticket' ? ' ac-gold' : ''}`;
      el.innerHTML = '<canvas class="ac-inv-fig" aria-hidden="true"></canvas><span class="ac-piece"></span><span class="ac-cw mono"></span><span class="ac-serial mono"></span>';
      el.querySelector('.ac-piece').textContent = it.name;
      el.querySelector('.ac-cw').textContent = it.color;
      el.querySelector('.ac-serial').textContent = e.serial;
      el.setAttribute('aria-label', `${it.name} ${it.color}, serial ${e.serial}`);
      if (window.GoodItems && crateItems[e.item]) GoodItems.draw(it, el.querySelector('canvas')).catch(() => {});
      return el;
    }));
  }

  // ACHIEVEMENTS: earned ones first, each with the % of players who have it.
  function drawAchievements() {
    const got = achievements.filter((a) => a.earned).length;
    $('aCount').textContent = `${got} / ${achievements.length}`;
    const sorted = [...achievements].sort((a, b) => b.earned - a.earned);
    $('ach').replaceChildren(...sorted.map((a) => {
      const el = document.createElement('div');
      el.className = `ac-ach-card${a.earned ? '' : ' locked'}`;
      el.innerHTML = '<img alt="" draggable="false"><div><span class="ac-ach-n"></span><span class="ac-ach-d"></span><span class="ac-ach-p mono"></span></div>';
      el.querySelector('img').src = a.icon;
      el.querySelector('.ac-ach-n').textContent = a.name;
      el.querySelector('.ac-ach-d').textContent = a.desc;
      el.querySelector('.ac-ach-p').innerHTML = `<span>${a.pct}% OF PLAYERS HAVE THIS</span><span>${a.earned ? (a.at ? `EARNED ${a.at.slice(0, 10)}` : 'EARNED') : 'LOCKED'}</span>`;
      return el;
    }));
  }

  // Owner: the ledger of every serialized pull (not the GD-999 set).
  function drawLedger() {
    if (!(me && me.owner)) { $('ledger').hidden = true; return; }
    fetch('api/crate?ledger=1').then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (!j) return;
      $('ledger').hidden = false;
      $('ledgerCount').textContent = `${j.rows.length} PULLS`;
      $('ledgerRows').replaceChildren(...j.rows.map((r) => {
        const it = crateItems[r.item] || { name: r.item, color: '' };
        const tr = document.createElement('tr');
        for (const t of [r.serial, `${it.name} ${it.color}`, r.name, (r.at || '').slice(0, 10)]) { const td = document.createElement('td'); td.textContent = t; tr.append(td); }
        return tr;
      }));
    }).catch(() => {});
  }

  $('invReset').onclick = async () => {
    if (!confirm('Clear your GOOD® CRATE pulls and reset every serial back to GD-001?')) return;
    try { await post('api/crate', { action: 'reset' }); inventory = inventory.filter((e) => e.serial === 'GD-999'); drawInventory(); drawLedger(); toast('CRATE TEST RESET. SERIALS START AT GD-001 AGAIN.'); } catch { toast('COULDN’T RESET. TRY AGAIN.'); }
  };

  $('form').onsubmit = async (e) => {
    e.preventDefault();
    $('msg').textContent = 'SENDING…';
    try { await post('api/auth', { action: 'request', email: $('email').value }); $('msg').textContent = 'CHECK YOUR EMAIL. NOT THERE? PLEASE CHECK YOUR SPAM FOLDER. THE LINK WORKS FOR 15 MINUTES.'; }
    catch (err) { $('msg').textContent = err.code === 'email_not_configured' ? 'SIGN-IN OPENS SOON.' : err.code === 'email' ? 'THAT EMAIL DOESN’T LOOK RIGHT.' : err.code === 'slow_down' ? 'SLOW DOWN. TRY AGAIN IN A MINUTE.' : 'COULDN’T SEND. TRY AGAIN.'; }
  };
  $('signout').onclick = async () => { await post('api/auth', { action: 'logout' }).catch(() => {}); me = null; render(); };
  $('rename').onclick = async () => {
    const n = prompt('Your GOOD® name. It\'s on your comments and it\'s your profile link (good.leems.me/profiles/your-name):', me.name);
    if (!n) return;
    try { const j = await post('api/me', { action: 'name', name: n }); me.name = j.name; me.profile = j.profile; render(); } catch (e) { toast(e.code === 'taken' ? 'THAT NAME IS TAKEN. TRY ANOTHER.' : '2 TO 16 LETTERS OR NUMBERS.'); }
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
    me = j.user; wardrobe = j.wardrobe || []; inventory = j.inventory || []; achievements = j.achievements || [];
    render();
    fetch('api/crate').then((r) => r.json()).then((c) => { crateItems = Object.fromEntries((c.items || []).map((i) => [i.id, i])); if (me) { drawInventory(); drawLedger(); } }).catch(() => {});
    if (signin === 'ok' && me) toast(`SIGNED IN AS ${me.name}.`);
    if (signin === 'expired') toast('THAT LINK EXPIRED. ASK FOR A NEW ONE.');
  });
})();
