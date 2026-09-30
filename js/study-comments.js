// STUDY® comments for the post on this page (article[data-slug]). Comments are
// plain text, drawn with textContent only; stored by api/comments.js.
(() => {
  const $ = (id) => document.getElementById(id);
  const slug = document.querySelector('.st-article').dataset.slug;
  const list = $('stComments');
  const msg = $('stFormMsg');
  const form = $('stForm');
  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const draw = (c, top) => {
    const li = document.createElement('li');
    const head = document.createElement('p');
    head.className = 'st-c-head';
    const who = document.createElement('strong'); who.textContent = c.name || 'ANONYMOUS';
    const when = document.createElement('span'); when.textContent = fmt(c.at);
    head.append(who, when);
    const p = document.createElement('p'); p.textContent = c.text;
    li.append(head, p);
    if (top) list.prepend(li); else list.append(li);
  };
  fetch(`/api/comments?post=${slug}`).then(async (r) => {
    if (r.status === 503) { msg.textContent = 'Comments open soon.'; form.querySelector('button').disabled = true; return; }
    if (!r.ok) throw new Error();
    const { comments } = await r.json();
    comments.forEach((c) => draw(c));
    if (!comments.length) msg.textContent = 'Be the first.';
  }).catch(() => { msg.textContent = 'Comments couldn’t load.'; });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const f = form.elements;
    const btn = form.querySelector('button');
    btn.disabled = true; msg.textContent = 'Posting…';
    try {
      const r = await fetch('/api/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: slug, name: f.name.value, text: f.text.value, website: f.website.value }),
      });
      if (r.status === 429) { msg.textContent = 'Slow down. Try again in a minute.'; return; }
      if (!r.ok) throw new Error();
      const { comment } = await r.json();
      if (comment) draw(comment, true);
      f.text.value = '';
      msg.textContent = 'Posted. Thank you.';
    } catch {
      msg.textContent = 'Couldn’t post. Try again.';
    } finally {
      btn.disabled = false;
    }
  };
})();
