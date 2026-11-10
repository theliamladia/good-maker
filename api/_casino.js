// GOOD® CASINO (/casino): BLACKJACK, HIGH-LOW and ROULETTE for GOOD® COINS (free, never real
// money). Not a route: api/crate.js dispatches here (Vercel Hobby allows 12 functions).
//   GET  /api/crate?casino=1                                    -> { coins, bj, hl, hist, min, max }
//   POST /api/crate { action: 'casino', game: 'bj', move: 'deal', bet } | { move: 'hit' | 'stand' | 'double' }
//   POST /api/crate { action: 'casino', game: 'hl', move: 'start', bet } | { move: 'higher' | 'lower' | 'cash' }
//   POST /api/crate { action: 'casino', game: 'roulette', move: 'spin', bet, pick: { type, n } }
// Server-authoritative: every shuffle, card and spin comes from crypto.randomInt here, never
// from the page. Hands in progress live in Redis (casino:bj:<uid>, casino:hl:<uid>), so a
// refresh can't reroll; the shoe never leaves the server and the dealer's hole card stays
// hidden until the hand ends. Coins move only under the account's coin lock (crate:lock:<uid>,
// shared with crates and MARKET®), so nothing can be spent twice and coins never go negative.
const crypto = require('crypto');
const { redis, overLimit } = require('./_redis');
const { isOwner, saveUser } = require('./_account');

// Preview until the owner ships it: while false only the owner can play; everyone else gets 404.
const OPEN = true;   // shipped 10 November 2026, at the owner's word
const MIN_BET = 1, MAX_BET = 100;
const HAND_TTL = 6 * 3600;         // an abandoned hand expires (its bet is lost, as if folded)
const HIST_MAX = 50;
const HL_EDGE = 0.97, HL_MAX_POT = 10000;

const SUITS = ['S', 'H', 'D', 'C'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const card = (i) => ({ r: RANKS[i % 13], s: SUITS[Math.floor(i / 13) % 4] });
// Fisher-Yates with a cryptographic RNG.
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(0, i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const shoe = (decks) => shuffle(Array.from({ length: 52 * decks }, (_, i) => card(i)));

// ---- BLACKJACK ----------------------------------------------------------------------------
// Six-deck shoe, reshuffled every hand. Dealer stands on soft 17. Blackjack pays 3:2 (rounded
// down), a push returns the bet, DOUBLE only on the first two cards. Kept simple on purpose:
// no split and no insurance. The dealer checks for blackjack straight away (the hand ends).
function total(hand) {
  let t = 0, aces = 0;
  for (const c of hand) { if (c.r === 'A') { aces++; t += 11; } else t += ['J', 'Q', 'K'].includes(c.r) ? 10 : +c.r; }
  while (t > 21 && aces) { t -= 10; aces--; }
  return t;
}
const natural = (hand) => hand.length === 2 && total(hand) === 21;
function bjView(s) {
  const done = !!s.done;
  return {
    bet: s.bet, player: s.player, playerTotal: total(s.player),
    dealer: done ? s.dealer : [s.dealer[0], null], dealerTotal: done ? total(s.dealer) : total([s.dealer[0]]),
    canDouble: !done && s.player.length === 2, done, result: s.result, payout: s.payout,
  };
}
// Ends the hand: the dealer draws (unless the player already bust or there was a blackjack),
// then returns what the hand pays back (stake included).
function settleBj(s) {
  const p = total(s.player);
  if (p > 21) { s.result = 'BUST'; s.payout = 0; }
  else if (natural(s.player) || natural(s.dealer)) {
    if (natural(s.player) && natural(s.dealer)) { s.result = 'PUSH'; s.payout = s.bet; }
    else if (natural(s.player)) { s.result = 'BLACKJACK'; s.payout = s.bet + Math.floor(s.bet * 1.5); }
    else { s.result = 'DEALER BLACKJACK'; s.payout = 0; }
  } else {
    while (total(s.dealer) < 17) s.dealer.push(s.shoe.pop());   // soft 17 counts as 17: stand
    const d = total(s.dealer);
    if (d > 21) { s.result = 'DEALER BUSTS'; s.payout = s.bet * 2; }
    else if (p > d) { s.result = 'WIN'; s.payout = s.bet * 2; }
    else if (p === d) { s.result = 'PUSH'; s.payout = s.bet; }
    else { s.result = 'LOSE'; s.payout = 0; }
  }
  s.done = true;
  return s;
}

// ---- HIGH-LOW -----------------------------------------------------------------------------
// Each card comes from a fresh 52-card deck, ace high. A tie loses. A right guess multiplies the
// pot by 0.97 / p (p = the chance of that guess). The pot is kept exact and rounded down only when
// you're paid, so small bets keep the same 3% edge as big ones. Shown (rounded down) before you guess.
const rankOf = (c) => RANKS.indexOf(c.r) + 2;                       // 2..14
const chance = (c, dir) => (dir === 'higher' ? 14 - rankOf(c) : rankOf(c) - 2) / 13;
const nextPot = (pot, p) => (p > 0 ? pot * HL_EDGE / p : 0);
const coinsOf = (pot) => Math.floor(pot + 1e-9);   // what a pot pays out
function hlView(s) {
  const odds = {};
  for (const d of ['higher', 'lower']) { const p = chance(s.card, d); odds[d] = { p: Math.round(p * 1000) / 1000, pot: coinsOf(nextPot(s.pot, p)), x: p > 0 ? Math.round(HL_EDGE / p * 100) / 100 : 0 }; }
  return { bet: s.bet, pot: coinsOf(s.pot), card: s.card, prev: s.prev || null, streak: s.streak, odds, canCash: s.streak > 0 };
}

// ---- ROULETTE -----------------------------------------------------------------------------
// European, single zero. One bet per spin. Even money: RED/BLACK, ODD/EVEN, 1-18/19-36 (zero
// loses them all). DOZEN pays 2:1, a STRAIGHT number 35:1.
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const colorOf = (n) => (n === 0 ? 'GREEN' : REDS.has(n) ? 'RED' : 'BLACK');
const PAYS = { red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1, dozen: 2, straight: 35 };
function wins(pick, n) {
  if (pick.type === 'straight') return n === pick.n;
  if (n === 0) return false;
  switch (pick.type) {
    case 'red': return REDS.has(n);
    case 'black': return !REDS.has(n);
    case 'odd': return n % 2 === 1;
    case 'even': return n % 2 === 0;
    case 'low': return n <= 18;
    case 'high': return n >= 19;
    case 'dozen': return Math.ceil(n / 12) === pick.n;
  }
  return false;
}
function cleanPick(p) {
  p = p || {};
  const type = String(p.type || '');
  if (!(type in PAYS)) return null;
  if (type === 'straight') { const n = +p.n; return Number.isInteger(n) && n >= 0 && n <= 36 ? { type, n } : null; }
  if (type === 'dozen') { const n = +p.n; return [1, 2, 3].includes(n) ? { type, n } : null; }
  return { type };
}
const pickLabel = (p) => ({ red: 'RED', black: 'BLACK', odd: 'ODD', even: 'EVEN', low: '1-18', high: '19-36' }[p.type]
  || (p.type === 'dozen' ? ['1ST', '2ND', '3RD'][p.n - 1] + ' 12' : `STRAIGHT ${p.n}`));

// ---- Storage ------------------------------------------------------------------------------
const key = (g, uid) => `casino:${g}:${uid}`;
async function getJSON(k) { const r = await redis('GET', k); try { return r ? JSON.parse(r) : null; } catch { return null; } }
const putState = (k, s) => redis('SET', k, JSON.stringify(s), 'EX', HAND_TTL);
async function logGame(uid, row) {
  await redis('LPUSH', key('hist', uid), JSON.stringify({ ...row, net: row.payout - row.bet, at: new Date().toISOString() }));
  await redis('LTRIM', key('hist', uid), 0, HIST_MAX - 1);
}
const history = async (uid, n = 10) => ((await redis('LRANGE', key('hist', uid), 0, n - 1)) || []).map((r) => JSON.parse(r));
const allowed = (me) => !!me && (OPEN || isOwner(me));

// GET /api/crate?casino=1
async function state(req, res, me) {
  if (!me && OPEN) { res.status(401).json({ error: 'signed_out' }); return; }
  if (!allowed(me)) { res.status(404).json({ error: 'gone' }); return; }
  const bj = await getJSON(key('bj', me.uid)), hl = await getJSON(key('hl', me.uid));
  res.status(200).json({ coins: me.coins || 0, min: MIN_BET, max: MAX_BET, bj: bj ? bjView(bj) : null, hl: hl ? hlView(hl) : null, hist: await history(me.uid) });
}

// POST /api/crate { action: 'casino', game, move, bet?, pick? }
async function play(req, res, me, body, { lockUser, unlockUser }) {
  if (!allowed(me)) { res.status(404).json({ error: 'gone' }); return; }
  if (await overLimit(req, `casino:${me.uid}`, 120)) { res.status(429).json({ error: 'slow_down' }); return; }
  const game = String(body.game || ''), move = String(body.move || '');
  if (!(await lockUser(me.uid))) { res.status(409).json({ error: 'busy' }); return; }
  try {
    const user = await getJSON(`user:${me.uid}`);
    if (!user) { res.status(401).json({ error: 'signed_out' }); return; }
    user.coins = Math.max(0, Math.floor(user.coins || 0));
    const out = async (extra) => res.status(200).json({ coins: user.coins, hist: await history(me.uid), ...extra });
    // A new stake: whole coins, MIN_BET..MAX_BET, never more than the balance.
    const stake = () => {
      const bet = Number(body.bet);
      if (!Number.isInteger(bet) || bet < MIN_BET || bet > MAX_BET) { res.status(400).json({ error: 'bet', min: MIN_BET, max: MAX_BET }); return 0; }
      if (bet > user.coins) { res.status(402).json({ error: 'coins', coins: user.coins }); return 0; }
      return bet;
    };

    if (game === 'bj') {
      const k = key('bj', me.uid);
      let s = await getJSON(k);
      if (move === 'deal') {
        if (s) { await out({ bj: bjView(s), resumed: true }); return; }   // a hand is already on the table
        const bet = stake(); if (!bet) return;
        user.coins -= bet;
        const sh = shoe(6);
        s = { bet, shoe: sh, player: [sh.pop()], dealer: [sh.pop()] };
        s.player.push(sh.pop()); s.dealer.push(sh.pop());
        if (natural(s.player) || natural(s.dealer)) settleBj(s);
      } else {
        if (!s) { res.status(410).json({ error: 'no_hand' }); return; }
        if (move === 'hit') { s.player.push(s.shoe.pop()); if (total(s.player) >= 21) settleBj(s); }
        else if (move === 'stand') settleBj(s);
        else if (move === 'double') {
          if (s.player.length !== 2) { res.status(400).json({ error: 'no_double' }); return; }
          if (user.coins < s.bet) { res.status(402).json({ error: 'coins', coins: user.coins }); return; }
          user.coins -= s.bet; s.bet *= 2; s.doubled = true;
          s.player.push(s.shoe.pop()); settleBj(s);
        } else { res.status(400).json({ error: 'move' }); return; }
      }
      if (s.done) {
        user.coins += s.payout;
        await redis('DEL', k);
        await logGame(me.uid, { game: 'BLACKJACK', bet: s.bet, payout: s.payout, result: s.result, detail: `${total(s.player)} V ${total(s.dealer)}${s.doubled ? ' · DOUBLED' : ''}` });
      } else await putState(k, s);
      await saveUser(user);
      await out({ bj: bjView(s) }); return;
    }

    if (game === 'hl') {
      const k = key('hl', me.uid);
      let s = await getJSON(k);
      if (move === 'start') {
        if (s) { await out({ hl: hlView(s), resumed: true }); return; }
        const bet = stake(); if (!bet) return;
        user.coins -= bet;
        s = { bet, pot: bet, streak: 0, card: card(crypto.randomInt(0, 52)) };
        await putState(k, s); await saveUser(user);
        await out({ hl: hlView(s) }); return;
      }
      if (!s) { res.status(410).json({ error: 'no_hand' }); return; }
      if (move === 'cash') {
        if (s.streak < 1) { res.status(400).json({ error: 'too_soon' }); return; }
        user.coins += coinsOf(s.pot);
        await redis('DEL', k); await saveUser(user);
        await logGame(me.uid, { game: 'HIGH-LOW', bet: s.bet, payout: coinsOf(s.pot), result: 'CASHED OUT', detail: `${s.streak} RIGHT` });
        await out({ hl: { ...hlView(s), done: true, result: 'CASHED OUT', payout: coinsOf(s.pot) } }); return;
      }
      if (move !== 'higher' && move !== 'lower') { res.status(400).json({ error: 'move' }); return; }
      const p = chance(s.card, move);
      if (p <= 0) { res.status(400).json({ error: 'no_odds' }); return; }
      const next = card(crypto.randomInt(0, 52));
      const right = move === 'higher' ? rankOf(next) > rankOf(s.card) : rankOf(next) < rankOf(s.card);
      s.prev = s.card; s.card = next;
      if (!right) {
        await redis('DEL', k);
        await logGame(me.uid, { game: 'HIGH-LOW', bet: s.bet, payout: 0, result: 'LOSE', detail: `${s.streak} RIGHT` });
        await out({ hl: { ...hlView(s), done: true, result: rankOf(next) === rankOf(s.prev) ? 'TIE · LOSE' : 'LOSE', payout: 0, guess: move } }); return;
      }
      s.streak++; s.pot = Math.min(HL_MAX_POT, nextPot(s.pot, p));
      if (s.pot >= HL_MAX_POT) {   // the table limit: cashed out for you
        user.coins += coinsOf(s.pot);
        await redis('DEL', k); await saveUser(user);
        await logGame(me.uid, { game: 'HIGH-LOW', bet: s.bet, payout: coinsOf(s.pot), result: 'TABLE LIMIT', detail: `${s.streak} RIGHT` });
        await out({ hl: { ...hlView(s), done: true, result: 'TABLE LIMIT · CASHED OUT', payout: coinsOf(s.pot), guess: move } }); return;
      }
      await putState(k, s);
      await out({ hl: { ...hlView(s), guess: move, right: true } }); return;
    }

    if (game === 'roulette') {
      if (move !== 'spin') { res.status(400).json({ error: 'move' }); return; }
      const pick = cleanPick(body.pick);
      if (!pick) { res.status(400).json({ error: 'pick' }); return; }
      const bet = stake(); if (!bet) return;
      const n = crypto.randomInt(0, 37);
      const win = wins(pick, n), payout = win ? bet * (1 + PAYS[pick.type]) : 0;
      user.coins += payout - bet;
      await saveUser(user);
      await logGame(me.uid, { game: 'ROULETTE', bet, payout, result: win ? 'WIN' : 'LOSE', detail: `${pickLabel(pick)} · ${n} ${colorOf(n)}` });
      await out({ spin: { n, color: colorOf(n), pick, label: pickLabel(pick), win, payout, bet } }); return;
    }
    res.status(400).json({ error: 'game' });
  } finally { await unlockUser(me.uid); }
}

module.exports = { state, play, OPEN, MIN_BET, MAX_BET };
