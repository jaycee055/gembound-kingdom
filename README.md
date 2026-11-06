# 👑 Gembound Kingdom

An original fantasy match-3 puzzle adventure. Help **Prince Aurelio** and **Lumi the Gemcat** restore eight magical regions across **160 levels**, defeat bosses, and rebuild the kingdom.

Free · no login · no ads · no tracking · works offline.

- ▶️ **Play in your browser:** https://jaycee055.github.io/gembound-kingdom/
- 🤖 **Android app (APK):** https://github.com/jaycee055/gembound-kingdom/releases/latest/download/GemboundKingdom.apk
- 🍎 **iPhone / iPad:** open the website in Safari → Share → *Add to Home Screen*
- 🔒 [Privacy policy & terms](https://jaycee055.github.io/gembound-kingdom/privacy.html)

## What's in the game

| Area | Features |
|---|---|
| Puzzle engine | 8×8 and 9×9 boards with custom shapes, swaps by tap or swipe, invalid-swap bounce, cascades, gravity with diagonal slides, guaranteed valid moves, auto-shuffle, hints, keyboard play |
| Power-ups | Crystal Beam (4 in a row), Fairy Spark (2×2), Dragon Core (L/T), Mystic Orb (5 in a row), Celestial Star (6+ or big cross) and 9 combinations |
| Obstacles | Crystal Cage, Magical Lock, Magic Resin, Frozen Floor (1–2 layers), Stone Barrier (1–3 layers), Ancient Chest, Enchanted Vine (spreads), Sealed Portal, Shadow Crystal (power-ups only), Ancient Relics to drop |
| Campaign | 8 regions × 20 levels, five difficulty tiers, treasure stages, milestone chests, a multi-stage boss at the end of each region, story scenes (skippable), Kingdom restoration with stars |
| Economy | Coins and crystals (earned only, no real money), 5 lives refilling every 30 min, 9 boosters, 5 chest types with published drop rates, free gift every 4 h |
| Live ops (local) | Daily rewards (7-day cycle), daily and weekly missions, rotating 3-day events, Weekend Adventure, monthly seasonal festival, weekly tournament against your own records |
| Modes | Endless, Daily Challenge, Limited-Move, Treasure Hunt, Survival, Puzzle Master |
| Meta | 35-item collection, avatars, frames, titles, outfits, pets, home backgrounds, 18 achievements, inbox, local team |
| Settings | Account (backup export/import, delete data), audio sliders, graphics quality, gameplay, accessibility (colorblind, symbols, high contrast, larger text, reduced motion, screen reader, animation speed, left-handed), notifications, 7 languages, privacy, support |

### What needs a server (not in this version)
Online accounts, cloud sync, real friend lists, team chat, life sharing and global leaderboards need a secure backend. This version runs fully on the device, clearly labels those screens, and never shows fake players.

## Project layout

```
index.html              the whole game (built from src/)
src/                    engine.js, data.js, art.js, audio.js, app-*.js, style.css
build.py                inlines src/ into index.html
tools/                  levels.js (bot simulation of every level), icon.py
manifest.webmanifest    installable web app
sw.js                   offline support
privacy.html            privacy policy + terms
android-app/            Capacitor wrapper (APK + iPhone)
.github/workflows/      android.yml (builds & publishes the APK), ios.yml
```

Edit files in `src/`, then run `python3 build.py` to regenerate `index.html`.
`node tools/levels.js "" 20` has a simple bot play every level 20 times and prints win rates, to check that no level is impossible.

## Android signing
`android-app/release.keystore` signs every APK so updates install over the old version without losing progress. Its password is in the workflow as a fallback, which is fine for a free side-loaded game but means anyone could sign an app as you. To lock it down: repo **Settings → Secrets and variables → Actions → New secret** named `KEYSTORE_PASSWORD` (current value `gembound-free-2026`; to change it, make a new keystore). Before publishing on Google Play, create a new private key and keep it out of the repo.

## iPhone app (optional, Apple Developer account ~US$99/yr)
`ios.yml` already compiles the iPhone app on every push. To upload to TestFlight, add secrets `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (App Store Connect API key). No Mac needed.

## Credits
All game design, code, characters, illustrations (drawn in code), music and sound effects (synthesized live) are original. Fonts: Fredoka and Cinzel (SIL Open Font License).
