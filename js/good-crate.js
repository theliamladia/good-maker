// The GOOD® CRATE landing page: the odds and every piece, from /api/crate.
(() => {
  const $ = (id) => document.getElementById(id);
  const TIER = { gold: 'GOLD ROLL', ticket: '???', rare: 'RARE', runway: 'RUNWAY®' };
  const pct = (p) => `${p < 1 ? p.toFixed(1) : String(p).replace(/\.0$/, '')}%`;
  GoodItems.ticket($('ticketFig'));
  fetch('api/crate').then((r) => r.json()).then(({ items = [] }) => {
    const by = Object.fromEntries(items.map((i) => [i.id, i]));
    if (by['goodie-im-sowwy']) { $('oddGoodie').textContent = pct(by['goodie-im-sowwy'].pct); GoodItems.draw(by['goodie-im-sowwy'], $('chaseFig')).catch(() => {}); }
    if (by['shirt-ii-im-sowwy']) $('oddS2').textContent = pct(by['shirt-ii-im-sowwy'].pct);
    if (by['shirt-im-sowwy']) $('oddS1').textContent = pct(by['shirt-im-sowwy'].pct);
    $('insideCount').textContent = `${items.length} PIECES · ODDS PER CRATE`;
    $('inside').replaceChildren(...items.map((it) => {
      const card = document.createElement('div');
      card.className = `cr-card cr-t-${it.tier}`;
      card.innerHTML = '<canvas class="cr-card-fig" aria-hidden="true"></canvas><span class="cr-card-n"></span><span class="cr-card-c mono"></span><span class="cr-card-r mono"></span>';
      card.querySelector('.cr-card-n').textContent = it.name;
      card.querySelector('.cr-card-c').textContent = it.color;
      card.querySelector('.cr-card-r').innerHTML = `<b>${pct(it.pct)}</b> ${TIER[it.tier]}${it.chase ? ' · THE CHASE' : ''}`;
      GoodItems.draw(it, card.querySelector('canvas')).catch(() => {});
      return card;
    }));
  }).catch(() => {});
})();
