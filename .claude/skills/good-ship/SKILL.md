---
name: good-ship
description: Ship a change to good.leems.me — commit straight to main, push, and confirm Vercel actually deployed it (it sometimes skips a push). Use after any site change the owner wants live ("push it", "ship it", "push it live").
---

# Ship to good.leems.me

The owner's standing rule: **push straight to main, no approval step, keep replies short.**
Previews stay previews (unlisted, not in MAKER®) until the owner says ship.

## Before committing
1. `node --check` every JS file you touched; parse any Python.
2. Run the page locally and look at it at 1440 and 390 (skill **good-dev-check**). No horizontal
   overflow at 390, no page errors.
3. `git status --short`: commit only what you meant to. Never commit preview PNGs/WebPs,
   `GOOD_LOCK_KEY`, passwords, or anything under `tools/studio/work/` (it's gitignored).

## Commit and push
```bash
git pull -q origin main
git add <files>
git commit -q -m "<AREA>: <what changed, in GOOD® voice>

<optional why>

Co-Authored-By: …   # the attribution lines from the session's system reminder
"
git push -q origin main
```
Message style used in this repo: `MARKET®: …`, `Profiles: …`, `Q&G® (/q): …`.

## Confirm it deployed
Vercel builds from main, usually live within 1–3 minutes. It has skipped pushes before, so check:
```bash
bash tools/dev/deployed.sh /q            # polls good.leems.me/<path> until 200 (10 min max)
bash tools/dev/deployed.sh /market.css "mk-tape"   # or until the body contains a marker
```
Run it in the background (it re-invokes you when done). If it times out:
- `gh api "repos/theliamladia/good-maker/deployments?per_page=3" --jq '.[] | "\(.sha[0:7]) \(.created_at)"'`
  shows whether Vercel created a deployment for the new commit.
- If the commit has no deployment, the owner may ask to "push it again": an empty commit
  (`git commit --allow-empty -m "Redeploy: …"`) re-triggers Vercel. Only when asked.

## Notes
- New serverless functions: the project is kept to 11. Fold new endpoints into existing ones
  (MARKET® lives in `api/crate.js`).
- `vercel.json` has `cleanUrls: true`: `foo.html` serves at `/foo`.
- Files a function reads at runtime must be listed in `vercel.json` `includeFiles`
  (e.g. `api/_locked/**` for `api/outfit.js`).
