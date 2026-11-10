// GOOD® CASINO (/casino): BLACKJACK, HIGH-LOW and ROULETTE for GOOD® COINS. The page only asks;
// the server (api/_casino.js via POST /api/crate { action: 'casino' }) shuffles, deals, spins and
// pays. A hand in progress comes back from GET /api/crate?casino=1, so a refresh keeps it.
(() => {
  const $ = (id) => document.getElementById(id);
  const coin = '<span class="coin" aria-hidden="true"></span>';
  const meOnce = () => (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })));
  let me = null, MIN = 1, MAX = 100, busy = false;

  let toastT;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800); }
  const ERR = { coins: 'NOT ENOUGH GOOD® COINS.', bet: 'BET 1 TO 100 GOOD® COINS.', busy: 'ONE MOMENT. TRY AGAIN.', slow_down: 'SLOW DOWN A LITTLE.', no_hand: 'THAT HAND IS OVER.', pick: 'PICK A BET FIRST.', signed_out: 'SIGN IN TO PLAY.', no_odds: 'THAT CAN’T WIN.', no_double: 'DOUBLE ON THE FIRST TWO CARDS ONLY.' };
  async function play(game, move, extra = {}) {
    if (busy) return null;
    busy = true;
    try {
      const r = await fetch('api/crate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'casino', game, move, ...extra }) });
      const j = await r.json().catch(() => ({}));
      if (typeof j.coins === 'number') setCoins(j.coins);
      if (!r.ok) { toast(ERR[j.error] || 'SOMETHING WENT WRONG. TRY AGAIN.'); return null; }
      if (j.hist) drawHist(j.hist);
      return j;
    } catch { toast('SOMETHING WENT WRONG. TRY AGAIN.'); return null; }
    finally { busy = false; }
  }

  function setCoins(c) {
    if (!me) return;
    me.coins = c;
    $('wallet').innerHTML = `${me.name} · ${coin}${c} GOOD® COINS`;
    window.GoodNav?.update(me);
  }

  // The bet: whole coins, MIN..MAX, chips set it.
  const bet = () => Math.floor(+$('bet').value);
  function betOk() {
    const b = bet();
    if (!(b >= MIN && b <= MAX)) { toast(`BET ${MIN} TO ${MAX} GOOD® COINS.`); return 0; }
    if (me && b > me.coins) { toast('NOT ENOUGH GOOD® COINS.'); return 0; }
    return b;
  }
  function markChip() { $('chips').querySelectorAll('button').forEach((c) => c.classList.toggle('on', +c.dataset.v === bet())); }
  $('chips').addEventListener('click', (e) => { const c = e.target.closest('button'); if (!c) return; $('bet').value = c.dataset.v; markChip(); });
  $('bet').addEventListener('input', markChip);
  // Bigger bets (50+) ask ARE YOU SURE? first.
  function sure(btn, b) {
    if (btn.classList.contains('cs-sure')) { btn.classList.remove('cs-sure'); btn.textContent = btn.dataset.label; return true; }
    if (b < 50) return true;
    btn.dataset.label = btn.textContent; btn.classList.add('cs-sure'); btn.textContent = `ARE YOU SURE? ${b}`;
    setTimeout(() => { if (btn.classList.contains('cs-sure')) { btn.classList.remove('cs-sure'); btn.textContent = btn.dataset.label; } }, 4000);
    return false;
  }

  // Cards
  const SUIT = { S: '♠', H: '♥', D: '♦', C: '♣' }, SUITNAME = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
  function cardEl(c, cls = '') {
    const d = document.createElement('div');
    if (!c) { d.className = 'cs-card back ' + cls; d.textContent = 'GOOD®'; d.setAttribute('aria-label', 'Hidden card'); return d; }
    d.className = `cs-card ${c.s === 'H' || c.s === 'D' ? 'red' : ''} ${cls}`;
    d.setAttribute('aria-label', `${c.r} of ${SUITNAME[c.s]}`);
    d.innerHTML = `<span class="r">${c.r}<small>${SUIT[c.s]}</small></span><span class="s">${SUIT[c.s]}</span>`;
    return d;
  }
  // Redraw a row, keeping cards already shown (only new ones animate in).
  function cards(el, list) {
    const keys = list.map((c) => (c ? c.r + c.s : 'back'));
    const old = [...el.children].map((n) => n.dataset.k);
    if (keys.length < old.length || old.some((k, i) => k !== keys[i])) el.replaceChildren();
    list.forEach((c, i) => { if (el.children[i]) return; const n = cardEl(c); n.dataset.k = keys[i]; el.append(n); });
  }

  // BLACKJACK
  const RES = { WIN: 'You win', LOSE: 'Dealer wins', PUSH: 'Push. Your bet comes back', BUST: 'Bust', BLACKJACK: 'Blackjack', 'DEALER BLACKJACK': 'Dealer blackjack', 'DEALER BUSTS': 'Dealer busts. You win' };
  function drawBj(s) {
    const on = !!s && !s.done;
    $('bjDeal').hidden = on; $('bjHit').hidden = !on; $('bjStand').hidden = !on; $('bjDouble').hidden = !on;
    $('bjDouble').disabled = !(s && s.canDouble && me && me.coins >= s.bet);
    if (!s) return;
    cards($('bjDealer'), s.dealer); cards($('bjPlayer'), s.player);
    $('bjDT').textContent = s.done ? s.dealerTotal : `${s.dealerTotal} + ?`;
    $('bjPT').textContent = s.playerTotal;
    if (s.done) {
      const net = s.payout - s.bet;
      $('bjResult').innerHTML = `<b>${RES[s.result] || s.result}.</b> ${net > 0 ? `+${net}` : net} GOOD® COINS on a ${s.bet} bet.`;
    } else $('bjResult').innerHTML = `Bet <b>${s.bet}</b>. Hit, stand${s.canDouble ? ' or double' : ''}.`;
  }
  $('bjDeal').onclick = async (e) => { const b = betOk(); if (!b || !sure(e.currentTarget, b)) return; $('bjDealer').replaceChildren(); $('bjPlayer').replaceChildren(); const j = await play('bj', 'deal', { bet: b }); if (j) drawBj(j.bj); };
  for (const [id, m] of [['bjHit', 'hit'], ['bjStand', 'stand'], ['bjDouble', 'double']]) $(id).onclick = async () => { const j = await play('bj', m); if (j) drawBj(j.bj); else refresh(); };

  // HIGH-LOW
  function drawHl(s) {
    const on = !!s && !s.done;
    $('hlStart').hidden = on; $('hlHigher').hidden = !on; $('hlLower').hidden = !on; $('hlCash').hidden = !on;
    if (!s) { $('hlPot').textContent = '—'; $('hlStreak').textContent = '—'; return; }
    const shown = [];
    if (s.prev) shown.push(cardEl(s.prev, 'was'));
    shown.push(cardEl(s.card));
    $('hlCards').replaceChildren(...shown);
    $('hlPot').innerHTML = s.done ? `${s.payout}` : `${s.pot}`;
    $('hlStreak').textContent = s.streak;
    if (on) {
      const o = s.odds;
      $('hlHigher').disabled = !o.higher.p; $('hlLower').disabled = !o.lower.p;
      $('hlHigher').textContent = o.higher.p ? `HIGHER ×${o.higher.x.toFixed(2)} → ${o.higher.pot}` : 'HIGHER';
      $('hlLower').textContent = o.lower.p ? `LOWER ×${o.lower.x.toFixed(2)} → ${o.lower.pot}` : 'LOWER';
      $('hlCash').disabled = !s.canCash;
      $('hlCash').textContent = s.canCash ? `CASH OUT ${s.pot}` : 'CASH OUT';
      $('hlResult').innerHTML = s.right ? `<b>Right.</b> The pot is ${s.pot}. Keep going or cash out.` : `Bet <b>${s.bet}</b>. Higher or lower than the ${s.card.r}?`;
    } else {
      const net = s.payout - s.bet;
      $('hlResult').innerHTML = s.payout ? `<b>${s.result === 'CASHED OUT' ? 'Cashed out' : 'Table limit, cashed out'}.</b> ${s.payout} GOOD® COINS back, ${net >= 0 ? '+' : ''}${net} on a ${s.bet} bet.`
        : `<b>${s.result === 'TIE · LOSE' ? 'A tie, and a tie loses' : 'Wrong'}.</b> The ${s.card.r} after the ${s.prev.r}. The pot is gone.`;
    }
  }
  $('hlStart').onclick = async (e) => { const b = betOk(); if (!b || !sure(e.currentTarget, b)) return; const j = await play('hl', 'start', { bet: b }); if (j) drawHl(j.hl); };
  for (const [id, m] of [['hlHigher', 'higher'], ['hlLower', 'lower'], ['hlCash', 'cash']]) $(id).onclick = async () => { const j = await play('hl', m); if (j) drawHl(j.hl); else refresh(); };

  // ROULETTE
  let pick = { type: 'red' };
  const last = [];
  function choose(p) {
    pick = p;
    $('picks').querySelectorAll('[role=radio]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.t === p.type && (b.dataset.n ? +b.dataset.n === p.n : true))));
    $('picks').querySelector('.cs-straight').classList.toggle('on', p.type === 'straight');
  }
  $('picks').addEventListener('click', (e) => {
    const b = e.target.closest('[role=radio]');
    if (b) choose({ type: b.dataset.t, n: b.dataset.n ? +b.dataset.n : undefined });
    else if (e.target.closest('.cs-straight')) { $('rlN').focus(); choose({ type: 'straight', n: Math.floor(+$('rlN').value) }); }
  });
  $('rlN').addEventListener('input', () => choose({ type: 'straight', n: Math.floor(+$('rlN').value) }));
  $('rlSpin').onclick = async (e) => {
    if (pick.type === 'straight' && !($('rlN').value !== '' && pick.n >= 0 && pick.n <= 36)) { toast('PICK A NUMBER, 0 TO 36.'); return; }
    const b = betOk(); if (!b || !sure(e.currentTarget, b)) return;
    const ball = $('rlBall'); ball.className = 'cs-ball spin';
    const roll = setInterval(() => { $('rlNum').textContent = Math.floor(Math.random() * 37); }, 70);   // just the look; the server spins
    const t0 = Date.now(), j = await play('roulette', 'spin', { bet: b, pick });
    await new Promise((ok) => setTimeout(ok, Math.max(0, 900 - (Date.now() - t0))));
    clearInterval(roll);
    if (!j) { ball.className = 'cs-ball'; $('rlNum').textContent = '–'; return; }
    const s = j.spin;
    ball.className = `cs-ball ${s.color}`; $('rlNum').textContent = s.n;
    $('rlColor').textContent = `${s.n} ${s.color}`;
    const net = s.payout - s.bet;
    $('rlResult').innerHTML = s.win ? `<b>${s.label} wins.</b> +${net} GOOD® COINS.` : `<b>${s.n} ${s.color}.</b> ${s.label} loses ${s.bet}.`;
    last.unshift(`${s.n}`); last.length = Math.min(last.length, 12);
    $('rlLast').textContent = `LAST: ${last.join(' · ')}`;
  };

  // History
  const GAME = { BLACKJACK: 'BLACKJACK', 'HIGH-LOW': 'HIGH-LOW', ROULETTE: 'ROULETTE' };
  function drawHist(rows) {
    $('histEmpty').hidden = rows.length > 0;
    $('hist').replaceChildren(...rows.slice(0, 10).map((r) => {
      const tr = document.createElement('tr');
      const t = new Date(r.at);
      const cells = [[`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`], [GAME[r.game] || r.game], [`${r.result} · ${r.detail}`, 'cs-hide'], [r.bet, 'num'], [r.net > 0 ? `+${r.net}` : `${r.net}`, 'num']];
      for (const [v, cls] of cells) { const td = document.createElement('td'); td.textContent = v; if (cls) td.className = cls; tr.append(td); }
      return tr;
    }));
  }

  // Tabs (the last one you used is remembered on this device)
  function tab(g) {
    $('tabs').querySelectorAll('[data-g]').forEach((b) => { const on = b.dataset.g === g; b.setAttribute('aria-selected', String(on)); $('g-' + b.dataset.g).hidden = !on; });
    try { localStorage.setItem('cs-tab', g); } catch {}
  }
  $('tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) tab(b.dataset.g); });

  let active = null;
  async function refresh() {
    const r = await fetch('api/crate?casino=1', { cache: 'no-store' }).catch(() => null);
    if (!r || !r.ok) return r ? r.status : 0;
    const j = await r.json();
    MIN = j.min; MAX = j.max; $('bet').max = MAX;
    setCoins(j.coins); drawBj(j.bj); drawHl(j.hl); drawHist(j.hist || []);
    active = j.bj ? 'bj' : j.hl ? 'hl' : null;
    return 200;
  }

  (async () => {
    me = (await meOnce()).user || null;
    if (me) me = { ...me };
    const st = await refresh();
    if (st !== 200) {
      $('soon').hidden = false;
      if (st === 401) { $('soon').querySelector('.co-tag').textContent = 'SIGN IN'; $('soon').querySelector('.cs-note').innerHTML = '<a href="account">Sign in</a> to play for GOOD® COINS.'; }
      $('wallet').innerHTML = me ? `${me.name} · ${coin}${me.coins} GOOD® COINS` : '&nbsp;';
      return;
    }
    $('tables').hidden = false;
    let g = 'bj'; try { g = localStorage.getItem('cs-tab') || 'bj'; } catch {}
    tab(active || (['bj', 'hl', 'roulette'].includes(g) ? g : 'bj'));
    markChip();
  })();
})();
