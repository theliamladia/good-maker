// ART® IN MOTION (/inmotion): the wallet, THE CHASE and every piece with its odds,
// from /api/crate?crate=2. The crate isn't open yet, so there's nothing to roll here.
(() => {
  const $ = (id) => document.getElementById(id);
  const TIER = { chase: 'THE CHASE', rare: 'RARE', core: '' };
  const pct = (p) => `${String(p).replace(/\.0$/, '')}%`;
  const coin = '<span class="coin" aria-hidden="true"></span>';

  fetch('api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })).then(({ user }) => {
    $('wallet').innerHTML = user
      ? `${user.name} · YOU HAVE ${coin}${user.coins || 0} GOOD® COINS`
      : '<a href="account">SIGN IN</a> TO COLLECT GOOD® COINS BEFORE IT OPENS';
  });

  // LOOKBOOK: our players wearing the collection. Renders come scrambled like the pieces
  // and are drawn straight to canvas (no image files).
  const LOOKS = [
    ['CHINNY', "CHORE® VIRIDIAN/COBALT VIOLET · JEAN® SPLATTER THE JEAN · SCARF® SPLATTER"],
    ['LINDSEYYHAZEL', "BABY® BOYFRIEND HOODIE NAPLES YELLOW/PAYNE'S GREY · BABY® TIGHTS"],
    ['COOLB33S', 'TRENCH® ALIZARIN/MANGANESE BLUE · JEAJEAN® AGATE/SPRINGSTEEN'],
    ['LEEEEEMS', "INSIDE OUT® NAPLES YELLOW/PAYNE'S GREY · JEAN® PAINTER SPLATTER · SCARF® I'M SOWWY"],
    ['MOVA_TV', "CHORE® NAPLES YELLOW/PAYNE'S GREY · JEAN® ICE"],
    ['DAJIGGLER', 'TRENCH® VIRIDIAN/COBALT VIOLET · JEAJEAN® SPRINGSTEEN/THE JEAN'],
    ['BOBAYEET', 'INSIDE OUT® ALIZARIN/MANGANESE BLUE · JEAN® SPLATTER SELVEDGE'],
    ['LINDSEYYHAZEL', 'BABY® COZYKNIT VIRIDIAN/COBALT VIOLET · BABY® TIGHTS'],
    ['RACERJACK', "TRENCH® NAPLES YELLOW/PAYNE'S GREY · JEAN® BLEACHED · SCARF® SPLATTER"],
    ['AUSTIN1333', 'CHORE® ALIZARIN/MANGANESE BLUE · JEAJEAN® ICE/SELVEDGE'],
  ];
  const scrambled = async (id) => {
    const r = await fetch(`api/outfit?id=${id}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('unavailable');
    const { k, d } = await r.json();
    const kb = Uint8Array.from(atob(k), (c) => c.charCodeAt(0));
    return createImageBitmap(new Blob([Uint8Array.from(atob(d), (c, i) => c.charCodeAt(0) ^ kb[i % kb.length])]));
  };
  $('looks').replaceChildren(...LOOKS.map(([who, what], i) => {
    const fig = document.createElement('figure'); fig.className = 'im-look';
    fig.innerHTML = '<canvas aria-hidden="true"></canvas><figcaption><span class="im-card-n"></span><span class="im-card-c sc"></span></figcaption>';
    fig.querySelector('.im-card-n').textContent = who;
    fig.querySelector('.im-card-c').textContent = what;
    const cv = fig.querySelector('canvas');
    scrambled(`aim-look-${i}`).then((bmp) => { cv.width = bmp.width; cv.height = bmp.height; cv.getContext('2d').drawImage(bmp, 0, 0); bmp.close(); }).catch(() => {});
    return fig;
  }));
  document.getElementById('looks').addEventListener('contextmenu', (e) => e.preventDefault());

  fetch('api/crate?crate=2').then((r) => r.json()).then(({ items = [] }) => {
    const chase = items.find((i) => i.chase);
    if (chase) { $('chaseOdds').textContent = pct(chase.pct); GoodItems.draw(chase, $('chaseFig')).catch(() => {}); }
    $('insideCount').textContent = `${items.length} PIECES · ODDS PER CRATE`;
    // Rarest first, then the collection in its order.
    const order = { chase: 0, rare: 1, core: 2 };
    const sorted = [...items].sort((a, b) => order[a.tier] - order[b.tier]);
    const cardOf = (it) => {
      const card = document.createElement('figure');
      card.className = `im-card im-t-${it.tier}`;
      card.innerHTML = '<canvas aria-hidden="true"></canvas><figcaption><span class="im-card-n"></span><span class="im-card-c sc"></span><span class="im-card-r sc"></span></figcaption>';
      card.querySelector('.im-card-n').textContent = it.name;
      card.querySelector('.im-card-c').textContent = it.color;
      card.querySelector('.im-card-r').textContent = [pct(it.pct), TIER[it.tier]].filter(Boolean).join(' · ');
      GoodItems.draw(it, card.querySelector('canvas')).catch(() => {});
      return card;
    };
    // Three sections: tops, bottoms, and ACCESSORIES (the SCARF®: neither a top nor a bottom).
    $('insideTops').replaceChildren(...sorted.filter((i) => !i.bottom && !i.accessory).map(cardOf));
    $('insideBottoms').replaceChildren(...sorted.filter((i) => i.bottom).map(cardOf));
    $('insideAcc').replaceChildren(...sorted.filter((i) => i.accessory).map(cardOf));
  }).catch(() => {});
})();
