// RELEASES® UPCOMING: the drops in js/upcoming.js that have a date, soonest first, each with
// NOTIFY ME for signed-in players (POST /api/me { action: 'notify' }). Once a drop's date has
// passed the button reads AVAILABLE and links to it. Nothing on the list: the strip stays hidden.
(() => {
  const wrap = document.getElementById('upcoming');
  const grid = document.getElementById('upcomingList');
  const list = (window.GOOD_UPCOMING || []).filter((d) => d && d.id && d.name && !isNaN(Date.parse(d.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (!wrap || !grid || !list.length) return;

  let me = null, mine = new Set(), timer = 0;
  const out = (d) => Date.parse(d.date) <= Date.now();
  const when = (d) => {
    const t = new Date(d.date);
    const day = t.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' }).replace(',', '');
    const hm = t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${hm}`.toUpperCase();
  };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function action(d) {
    if (out(d)) { const a = el('a', 'rl-up-btn is-out mono', 'AVAILABLE →'); a.href = d.href || '#'; return a; }
    if (!me) { const a = el('a', 'rl-up-btn mono', 'SIGN IN TO GET NOTIFIED'); a.href = 'account'; return a; }
    const on = mine.has(d.id);
    const b = el('button', 'rl-up-btn mono' + (on ? ' is-on' : ''), on ? 'NOTIFYING ✓' : 'NOTIFY ME');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? `Stop notifying me about ${d.name}` : `Notify me when ${d.name} is out`);
    b.onclick = () => toggle(d, !on, b);
    return b;
  }

  async function toggle(d, on, b) {
    b.disabled = true;
    try {
      const r = await fetch('/api/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'notify', drop: d.id, on }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && Array.isArray(j.notify)) mine = new Set(j.notify);
      else if (r.status === 401) me = null;
    } catch {}
    render(d.id);
  }

  function render(focusId) {
    grid.replaceChildren(...list.map((d) => {
      const li = el('li', 'rl-up');
      li.append(el('p', 'rl-up-label mono', d.label || 'UPCOMING'), el('h3', 'rl-up-name', d.name),
        el('p', 'rl-up-when mono', out(d) ? 'OUT NOW' : when(d)), action(d));
      li.dataset.id = d.id;
      return li;
    }));
    if (focusId) grid.querySelector(`[data-id="${CSS.escape(focusId)}"] .rl-up-btn`)?.focus();
    // Flip the next drop to AVAILABLE when its time comes (if that's within a day).
    clearTimeout(timer);
    const next = list.map((d) => Date.parse(d.date) - Date.now()).filter((ms) => ms > 0).sort((a, b) => a - b)[0];
    if (next && next < 864e5) timer = setTimeout(() => render(), next + 500);
  }

  wrap.hidden = false;
  render();
  (window.__goodMe ||= fetch('/api/me').then((r) => (r.ok ? r.json() : { user: null })).catch(() => ({ user: null })))
    .then((j) => { me = j.user || null; mine = new Set((me && me.notify) || []); render(); });
})();
