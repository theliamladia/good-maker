---
name: good-dev-check
description: Run good.leems.me locally (all /api routes on an in-memory Redis, signed in as a test player) and screenshot/QA pages at desktop and phone width. Use to test any site or API change before pushing, to seed test data (listings, trades, users), or to look at a page.
---

# Local site + page check

## Start the local site
```bash
GOOD_LOCK_KEY="$(cat <scratchpad>/locked/GOOD_LOCK_KEY.txt)" \
  setsid nohup node tools/dev/devserver.js 8798 > <scratchpad>/dev.log 2>&1 < /dev/null &
```
- Serves the repo (clean URLs, `/profiles/<slug>`) and runs every `api/<name>.js` handler.
- Fake Redis (`tools/dev/fakeredis.js`) on :8797 (override with `FAKEREDIS_PORT`). Supports the
  commands the API uses; if a handler needs a new one, add it there.
- Signed in as **TESTER** (uid `u1`, 20 coins) with cookie `good_sid=testsession_abcdefghijklmnop`.
- `GOOD_LOCK_KEY` is only needed for sealed previews (`/api/outfit`). It lives in Vercel and in
  the scratchpad file — never in the repo, never in a commit or a message.
- Start servers with `setsid nohup … &` in one command: plain `&` servers die between tool calls.
  Don't `pkill -f <pattern>` — it can match and kill your own shell.

## Seed data
POST raw Redis commands to the fake Redis:
```bash
curl -s localhost:8797 -d '["SET","user:u2","{\"uid\":\"u2\",\"name\":\"MOVA\",\"coins\":50}"]'
curl -s localhost:8797 -d '["SET","profile:mova","u2"]'
curl -s localhost:8797 -d '["LPUSH","user:u2:inv","{\"id\":\"a1\",\"item\":\"runway-cross-jean\",\"serial\":\"GD-006\",\"at\":\"2026-10-10T00:00:00Z\"}"]'
```
Sessions: `SET sess:<sha256(sid)> <uid>`, then call the API with cookie `good_sid=<sid>` to act as
that player (e.g. list/buy on MARKET®: `POST /api/crate {action:'list'|'unlist'|'buy'}`).
Key shapes: `user:<uid>` (JSON, coins), `user:<uid>:inv` (list), `user:<uid>:owned` (set),
`user:<uid>:trades`, `market` (hash), `market:sales` (list).

## Check a page
```bash
NODE_PATH=$(npm root -g) node tools/dev/check.js /market            # signed in
NODE_PATH=$(npm root -g) node tools/dev/check.js /q --signed-out --wait=8000
```
Writes full-page screenshots at 1440 and 390 to `tools/studio/work/check/` and prints JS errors,
failed requests and anything overflowing the viewport. Open the PNGs with Read and actually look.
Fix every overflow at 390 (the site has a 16px side gutter, no horizontal scroll).

Google Fonts are proxied through curl so real fonts render (headless Chromium can't verify the
proxy's certificate by itself). Chromium is at `/opt/pw-browsers/chromium`; never `playwright install`.

## Phone layout notes
- MAKER® phone rules are scoped to `body.m-maker` (set by `js/mobile.js`) — never unscoped, or
  they leak to every page.
- Every page shares one `/api/me` request via `window.__goodMe` (`meOnce`).
