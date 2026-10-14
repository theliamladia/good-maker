// One-time account set-ups requested by the owner (not a route). Each runs once,
// on the next signed-in visit by that player or by the owner (api/me.js).
//   profile = the player's profile slug; skin = their home skin (base64 PNG);
//   prefs = THE MAKER settings they start from; coins = GOOD® COINS added once.
//   profile may be a list of slugs to try (the first that exists wins).
const { redis } = require('./_redis');

const SEEDS = [
  {
    id: 'mova-1',
    profile: 'mova',
    // MOVA's skin (everything drawn on the outer layer), nothing equipped, MY SKIN on.
    skin: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABINJREFUeF7tm7FyEzEQhnXMQKio0jFDQyhCwxPkDQIVL0ARd2QmKUMdl8lM6OyCGWoqoKNMQ0tDCkJDnQfAFByz5/vN3nqllewz1uFzkzh3p9v99tdKWimFy/9TShN33dbsT1duYnlQhG4IXrRa/kfXNxvATnFQAbguxxVvRD8i8ohPtxUAABxCovJ6AJ3PAZfnzu0dTd0oy9IVReHuHH5wvy6exoih2wogn2O81O6hfHHlJpsJgCXLvAHwJIcoIuP7Ih8r/5j5wtrnARKAdH6w7dzoRkcRusadp6d9w+baAVAf3ykOGh5yCOTk8Hh6+eRs+pN/l3CQMCUADoErKBsAcJpg0O9S5hKEdLxOeA2QMSrIAgCsxhC3aNb3jQT4u9YNsgJAhqI7WIkQ02LNKQ2kD242ACB9/OTR5Mb7+nbsyIB2kSuyAhA7DIYSXGr3yQFAqs2t3t8DaBVnBxvrFdDBoLVqcq+AVnF2sLFeAR0MWqsm9wpoFWcHG+sV0MGgtWpyr4BWcXawsV4BStDUnRhWlbGgLbyTU9sS3b5WPXLOWc83XNZuthywXmA9b3WUYPvWPsLGAmA1QStA6QoQBUfrBStVQMRmqWXfHICGwVZtXtuAsDR9v9ivbrlXfvJuUYXaSCmVK+2Ym6PLRky1nYNaBAA/CsO3zmL2C4RBNgCS+MOL51V0Qvt0VqTpOhl+Ofx7cmv7xLmboXNPXu27L6cfHX0PfaDAEABqjz57J9X+f6M5/lxd+7cBwPAYAJYcAQCOWwBC0YWK+D2fT6eHpfCRQJVDVGEAu25r1gVAk1744+Uz9+D1+9npLLwQxrw5G8+OrXCDJABE3qcAqThqi58I+374rjoKg/tWBkBKyRfpVSng2++Re3RrULEEAD76cACIOnWFkALq7mR3AZ6wrCwfC0BKlIzV+mxIAVqu4E5bAOrn47oAKYAnQ99w6Jl+zmyVMKUTPqXdLt9Wt/Lr/HSYbMd3YHLhHIAXWycxCQDkag1JMQcUoAANAHdawvApVfl7vAIwGozOJ2qCo+tcspQoQ2f1YgHAeThsHYMldT4u7sZOquwcILO4ZYCVB6g9itjgyD7VLSEh6wcnC2kX2weQ9v7wAefQXj/PQ9YUXbOpHkVMAPJZa2qctNhIhdXC/Un2r6Ie0IIPSzWRVND5bwEEhtCGz9EAEkpiS4Vv2YcxtQ8k8jkA3n9J8TVCietr+bM6tp5aglrWQeX5hv1yHsO/a4mUPJgDYI2z4iXrTopzABA4+KHNL7DOmAPAZ2Z8dchnfTkDgLN8nRCa3aoAuLMRk56sFEDVJxReAIHPNWS3VrsA72cEgNb+L46nh5jltetynCUA2EnLZQ0AAusFgGHEpwDqQ3XBJEsAvCKl5TQTAD+7SzTlwoeByQoA2Qrpyy6ARR4PrlcBfN2vqSBnANpQqy2fyQcVgCx6hMpjueUA36IIVW9cR25TAbD+Xd2vASAZ1Ykxuy4Qs3I0cwA1QkVKyvzoM56GswMwt7yt/9lSFnSoEBOVA4zpa7YAtIBxNVNe+AMnO5iv8VpUsAAAAABJRU5ErkJggg==',
    prefs: { look: {}, keepSkin: true },
  },
  // +10 GOOD® COINS from the owner (2026-10-14).
  { id: 'coins-mova-1', profile: ['mova', 'mova_tv'], coins: 10 },
  { id: 'coins-lindseyyhazel-1', profile: ['lindseyyhazel'], coins: 10 },
];

async function applySeeds() {
  for (const s of SEEDS) {
    if (await redis('GET', `seed:${s.id}`)) continue;
    let uid = null;
    for (const slug of [].concat(s.profile)) if ((uid = await redis('GET', `profile:${slug}`))) break;
    if (!uid) continue;
    const raw = await redis('GET', `user:${uid}`);
    if (!raw || !(await redis('SET', `seed:${s.id}`, 1, 'NX'))) continue;
    if (s.skin) await redis('SET', `user:${uid}:skin`, s.skin);
    if (s.prefs || s.coins) {
      const u = JSON.parse(raw);
      if (s.prefs) u.prefs = s.prefs;
      if (s.coins) u.coins = (u.coins || 0) + s.coins;
      await redis('SET', `user:${uid}`, JSON.stringify(u));
    }
  }
}

module.exports = { applySeeds };
