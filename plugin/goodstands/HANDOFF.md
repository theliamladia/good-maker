# GoodStands handoff (Minecraft server work)

This is the handoff for the Minecraft side of GOOD®. Work on the plugin lives in
`plugin/goodstands/` only. Touch the website (`api/`, `js/`, `index.html`) only when a task
needs it, and say so.

## House rules (from the owner)
- Push straight to `main` without asking. Keep replies short.
- Always write "GOOD®". Colourway names are ALL CAPS; colours take ™ (UNIQUE uses ⓤ).
- Never commit secrets (MineSkin key, lock keys, emails). `target/` is git-ignored; don't commit jars.
- After every plugin change: bump the version in **both** `pom.xml` and `src/main/resources/plugin.yml`,
  build, and send the owner the jar.

## The server
- **CraftBukkit 4226-Bukkit-2889b3a, Minecraft 1.21, Java 21.** This is plain CraftBukkit, not Spigot or Paper.
  Avoid Spigot-only APIs (`player.spigot()`, `net.md_5.bungee.*`, Adventure). Other plugins there
  (Slabbo, PhoenixCratesLite) crash for exactly this reason.
- It runs on the owner's Windows PC (`Downloads\CB Server`). You can't reach it. The owner tests and
  sends screenshots or console logs.
- Citizens **2.0.35 build 3598** is installed (it supports 1.21; newer Citizens dropped 1.20/1.21.0):
  https://ci.citizensnpcs.co/job/Citizens2/3598/artifact/dist/target/Citizens-2.0.35-b3598.jar
- Other plugins on the server include Essentials, LuckPerms, Vault, WorldEdit, Shopkeepers, UltraCosmetics.

## Build
```
cd plugin/goodstands && mvn -q -B package   # -> target/GoodStands-<version>.jar
```
- Compiles against `spigot-api 1.21-R0.1-SNAPSHOT` (Bukkit isn't published on its own) and
  `citizens-main 2.0.35-SNAPSHOT` (both `provided`). Java release 21.
- Quote any YAML value that contains `": "`. An unquoted colon in `plugin.yml` once stopped the plugin loading.
- Current version: **1.1.6**. The repo's `outfits.yml` now includes DOUBBIE® I COTTON/MAUVE, which isn't in a
  shipped jar yet, so the next build should be 1.1.7.

## How it works
Two kinds of stand:

1. **NPC stands (the main one).** A Citizens player NPC wears the outfit's real skin.
   - In MAKER® (good.leems.me), signed in, the **MINECRAFT STAND** button (`js/account.js` → `GoodApp.standSkin()` in `js/app.js`)
     draws *just the clothes on a plain white mannequin* (blank white head, no face, no hair) and POSTs the PNG to `/api/stand`.
   - `/api/stand` is rewritten to `api/skin.js`, which hands off to `api/_stand.js` (this keeps Vercel at 11 functions;
     a 12th failed the deploy). The server signs the PNG with MineSkin (`/v2/generate`, unlisted, optional `MINESKIN_KEY`
     env var) and stores `stand:<CODE>` → `{value, signature, slim, name}` in Upstash Redis. It returns a 6-character code.
     The same PNG always gets the same code (`stand:hash:<sha>`).
   - In-game, `/gs npc <CODE>` → `NpcStands.spawn` fetches `GET https://good.leems.me/api/stand?code=CODE` (the site is set
     in `config.yml`) and creates the NPC with `SkinTrait.setSkinPersistent`. Owner's choices: nametag hidden
     (`NAMEPLATE_VISIBLE=false`), no LookClose (head tracking is "creepy"), protected.
     A startup task strips LookClose from older stands.
   - Codes are reusable. Old codes keep whatever skin they were made with.
2. **Armor stands (fallback, no Citizens needed).** `/gs spawn <top> [bottom] [shoe] [skin]` or `/gs look <maker link>`.
   These use dyed leather + an armour trim matched to the colourway (`outfits.yml`) + a player head.
   - `outfits.yml` is generated: `node plugin/goodstands/gen-outfits.js` (run from the repo root) reads `js/outfits.js`
     and `js/app.js`. Re-run it whenever outfits change.

Commands (`/goodstand`, aliases `/gstand` and `/gs`; permission `goodstands.use`, op by default):
- `npc <code>`
- `spawn …`
- `look <link> [skin]`
- `list [tops|bottoms|shoes]`
- `center`: snaps the stand you're looking at to the middle of its block and turns it to the nearest of north/east/south/west
- `remove`: removes the stand you're looking at (8-block ray trace; walls block it)
- `reload`

New stands spawn in the dead centre of the block 2 ahead of the player, squared up to face them.

## Files
- `src/main/java/me/leems/goodstands/GoodStands.java`: commands, armor stands, `inFront`, `targetStand`, tab completion.
- `src/main/java/me/leems/goodstands/NpcStands.java`: everything that touches Citizens. It only loads when Citizens is
  enabled; keep Citizens imports out of `GoodStands.java`.
- `src/main/resources/plugin.yml`, `config.yml` (`site:`), `outfits.yml` (generated).
- Website side: `api/_stand.js`, `api/skin.js` (dispatch), `vercel.json` (rewrite), `js/app.js` (`mannequinPng`, `standSkin`),
  `js/account.js` (`#mcStand` button), `index.html` (button).

## Known limits / ideas
- The skin is public once signed. Anyone on the server can grab the texture. The owner accepted this.
- Anonymous MineSkin is rate-limited (the API retries once on a short 429). Add `MINESKIN_KEY` in Vercel if it gets slow.
- Locked pieces only make codes for accounts that own them (the same rule as downloading).
- Confirmed on the owner's server: `npc` spawning, `remove`, the hidden nametag and the white mannequin.
  Not yet confirmed: the `center` command, the `/gs` alias, and the armor-stand commands.
