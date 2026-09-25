// Vercel serverless function: GET /api/skin?name=<username>
// Looks the player up with Mojang directly (name -> UUID -> current skin) and
// returns the skin PNG from our own domain, so the browser can read its pixels
// and renamed players always get their current skin.

const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'good-design-skin-proxy' } });
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

module.exports = async function handler(req, res) {
  const name = String((req.query && req.query.name) || '').trim();
  if (!NAME_RE.test(name)) {
    res.status(400).json({ error: 'invalid_name' });
    return;
  }

  try {
    const profile = await getJson(`https://api.mojang.com/users/profiles/minecraft/${name}`);
    if (!profile || !profile.id) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    const session = await getJson(`https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`);
    const texProp = session && (session.properties || []).find((p) => p.name === 'textures');
    const textures = texProp && JSON.parse(Buffer.from(texProp.value, 'base64').toString('utf8')).textures;
    const skin = textures && textures.SKIN;
    if (!skin || !skin.url) {
      res.status(404).json({ error: 'no_skin' });
      return;
    }

    const png = await fetch(skin.url.replace(/^http:/, 'https:'));
    if (!png.ok) throw new Error(`texture -> ${png.status}`);
    const body = Buffer.from(await png.arrayBuffer());

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Skin-Model', skin.metadata && skin.metadata.model === 'slim' ? 'slim' : 'classic');
    res.setHeader('X-Player-Name', profile.name);
    // Skins change rarely; cache at the edge for 5 minutes.
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.status(200).send(body);
  } catch (err) {
    res.status(502).json({ error: 'upstream', detail: String(err.message || err) });
  }
};
