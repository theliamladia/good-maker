// GOOD® COINS today, live: how many coin saves are left, or the countdown until
// they come back. Fills every [data-coin-timer] on the page (the same line as
// under SAVE TO WARDROBE in THE MAKER). GoodCoinTimer.refresh() re-reads /api/me.
(() => {
  const pad = (n) => String(n).padStart(2, '0');
  const coin = '<span class="coin" aria-hidden="true"></span>';
  let daily = null, signedIn = false, t;
  function draw() {
    clearTimeout(t);
    let html;
    if (!signedIn || !daily) html = `${coin}+10 GOOD® COINS FOR EACH NEW FIT · 2 A DAY`;
    else if (daily.left > 0) html = `${coin}SAVE ${daily.left} MORE NEW FIT${daily.left > 1 ? 'S' : ''} TODAY FOR +${daily.coins} EACH`;
    else {
      const ms = Date.parse(daily.resetsAt) - Date.now();
      if (ms <= 0) { daily.left = daily.per; return draw(); }
      const s = Math.floor(ms / 1000);
      html = `${coin}MORE GOOD® COINS IN ${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
      t = setTimeout(draw, 1000 - (Date.now() % 1000));
    }
    document.querySelectorAll('[data-coin-timer]').forEach((el) => { if (el.innerHTML !== html) el.innerHTML = html; });
  }
  function refresh() {
    return fetch('api/me').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((j) => {
      signedIn = !!j.user; daily = (j.user && j.user.daily) || null; draw();
    });
  }
  window.GoodCoinTimer = { refresh, draw };
  refresh();
})();
