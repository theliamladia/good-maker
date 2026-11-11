// MEMBERS®: every GOOD® profile as one row on GOOD® BLUE, between thin rules: the face, the
// name (and ADMIN / tags), then GOOD® COINS, ACHIEVEMENTS and MEMBER SINCE, each labelled.
(() => {
  const $ = (id) => document.getElementById(id);
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const since = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : '—'; };
  const stat = (k, v) => {
    const s = document.createElement('span'); s.className = 'mb-stat';
    s.innerHTML = '<span class="mb-k mono"></span><span class="mb-v"></span>';
    s.firstChild.textContent = k; s.lastChild.textContent = v;
    return s;
  };
  fetch('api/members').then((r) => r.json()).then(({ members = [] }) => {
    $('mCount').textContent = `${members.length} ${members.length === 1 ? 'MEMBER' : 'MEMBERS'}`;
    $('members').replaceChildren(...members.map((m) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'mb-row'; a.href = `profiles/${m.slug}`;
      a.innerHTML = '<canvas class="mb-head" aria-hidden="true"></canvas><span class="mb-who"><span class="mb-name"></span></span>';
      a.querySelector('.mb-name').textContent = m.name;
      const who = a.querySelector('.mb-who');
      const tags = [...(m.admin ? ['ADMIN'] : []), ...(m.tags || [])];
      if (tags.length) {
        const t = document.createElement('span'); t.className = 'mb-tags';
        for (const x of tags) { const b = document.createElement('span'); b.className = 'mb-tag-q mono'; b.textContent = x; t.append(b); }
        who.append(t);
      }
      const stats = document.createElement('span'); stats.className = 'mb-stats';
      stats.append(stat('GOOD® COINS', m.coins), stat('ACHIEVEMENTS', m.achievements), stat('MEMBER SINCE', since(m.since)));
      const go = document.createElement('span'); go.className = 'mb-go mono'; go.setAttribute('aria-hidden', 'true'); go.textContent = '→';
      a.append(stats, go);
      GoodHeads.draw(a.querySelector('canvas'), m.hasSkin ? `api/profile?name=${encodeURIComponent(m.slug)}&skin=1` : null);
      li.append(a);
      return li;
    }));
  }).catch(() => { $('mCount').textContent = 'COULDN’T LOAD MEMBERS'; });
})();
