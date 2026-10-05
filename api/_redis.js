// Upstash Redis over its REST API, shared by the STUDY® comments and the
// GOOD® GALLERY. Any env prefix works (KV_, STORAGE_, ...): the first
// *_REST_API_URL with a matching token. Not a route (leading underscore).
const crypto = require('crypto');

const env = process.env;
const pre = ['KV', 'STORAGE', 'UPSTASH_REDIS']
  .concat(Object.keys(env).filter((k) => k.endsWith('_REST_API_URL')).map((k) => k.slice(0, -'_REST_API_URL'.length)))
  .find((p) => env[`${p}_REST_API_URL`] && env[`${p}_REST_API_TOKEN`]);
const URL_ = pre ? env[`${pre}_REST_API_URL`] : env.UPSTASH_REDIS_REST_URL;
const TOKEN = pre ? env[`${pre}_REST_API_TOKEN`] : env.UPSTASH_REDIS_REST_TOKEN;

const configured = () => !!(URL_ && TOKEN);

async function redis(...cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}

// At most `max` calls a minute per IP for this bucket. The counter is created
// with its expiry first (NX), so a failed call can never leave it without a TTL.
async function overLimit(req, bucket, max) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const key = `${bucket}:rl:${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24)}`;
  await redis('SET', key, 0, 'EX', 60, 'NX');
  return (await redis('INCR', key)) > max;
}

const parseBody = (req) => {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
};

module.exports = { redis, configured, overLimit, parseBody };
