// MEMBERS®: every GOOD® profile as a card with their player head.
(() => {
  const $ = (id) => document.getElementById(id);
  fetch('api/members').then((r) => r.json()).then(({ members = [] }) => {
    $('mCount').textContent = `${members.length} ${members.length === 1 ? 'MEMBER' : 'MEMBERS'}`;
    $('members').replaceChildren(...members.map((m) => {
      const a = document.createElement('a');
      a.className = 'mb-card'; a.href = `profiles/${m.slug}`;
      a.innerHTML = '<canvas class="mb-head" aria-hidden="true"></canvas><span class="mb-meta"><span class="mb-name"></span><span class="mb-stats mono"></span></span>';
      const n = a.querySelector('.mb-name'); n.textContent = m.name;
      if (m.admin) { const b = document.createElement('span'); b.className = 'mb-admin mono'; b.textContent = 'ADMIN'; n.append(b); }
      a.querySelector('.mb-stats').innerHTML = `<span class="coin" aria-hidden="true"></span>${m.coins} · ${m.achievements} ${m.achievements === 1 ? 'ACHIEVEMENT' : 'ACHIEVEMENTS'}`;
      GoodHeads.draw(a.querySelector('canvas'), m.hasSkin ? `api/profile?name=${encodeURIComponent(m.slug)}&skin=1` : null);
      return a;
    }));
  }).catch(() => { $('mCount').textContent = 'COULDN’T LOAD MEMBERS'; });
})();
