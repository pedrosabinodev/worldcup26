# World Cup 26 — project guide

Single-page trivia game: guess which country a FIFA World Cup 2026 player represents.
Plain HTML + CSS + vanilla JS. No framework, no build step, no backend. Hosted on Vercel
(every push to `main` deploys).

## Run locally
Serve the folder over HTTP (opening the file directly also works):
```
npx http-server -p 8080 -c-1 .
```
Then open http://localhost:8080.

## Files
```
index.html            markup only (screens, header, share modal)
css/styles.css        all styles; mobile layout under @media(max-width:600px)
js/data/players.js    PLAYERS — 1,248 players from the official squads
js/data/clubs.js      CLUB_WIKI (club → Wikipedia title for the crest), CLUB_BADGES (SVG fallback)
js/data/worldcup.js   COUNTRIES (48 nations + PT names), WC26_MATCHES (all 104 results)
js/i18n.js            EN/PT strings, t(), countryName(), applyLang()
js/app.js             game state, rendering, media loading, answer/results/share, events
caseTVLogo.png        icon on the "Watch match" button
data-sources/         reference records the game does NOT load (e.g. the CazéTV
                      last-match video list the `link` fields were taken from)
```
Scripts are classic `<script>` tags loaded in that order and share globals — data first,
then i18n, then app.

## Conventions
- Compact style: 2-space indent, no spaces around operators, single-line helpers where short.
- Clicks go through one delegated handler: add `data-action="name"` in markup and a
  matching entry in `ACTIONS` (app.js). No inline `onclick`.
- Static text: add a key to `STRINGS` (i18n.js) and mark the element `data-i18n="key"`
  (`data-i18n-html` when it contains markup). Dynamic text: `t('English','Português')`.
- Anything user/data-derived that goes into `innerHTML` goes through `esc()`.
- Mobile and desktop are different DOM layouts, picked per round in `renderRound()`
  (`MOBILE_MAX_WIDTH`). Shared pieces live in small `*Html()` helpers.

## Data
**Player** — `{name, country, code, pos, club, d, wiki, photo?}`
- `country` must match a `COUNTRIES` entry; `code` is the flagcdn ISO code (`gb-eng`, `gb-sct`).
- `d`: 1 = Stars Only pool, ≤2 = Mixed, 3 = All Players only.
- `photo`: TheSportsDB image. If missing or broken, the Wikipedia thumbnail of `wiki` is used.

**Club crest** — `CLUB_WIKI` is keyed by the exact `club` string in PLAYERS. Clubs not
listed get `CLUB_BADGES[club]` or a generic three-letter badge.

**Match** — `{date, time, stage, t1, c1, t2, c2, s1, s2, aet?, pen?, link?}`
- Times are Brasília (UTC−3). `s1`/`s2` include extra time; penalties are only in `pen`.
- The reveal box shows each team's *last* match (`getLastMatch`) with its score.
- `link`: CazéTV full-match replay, set on every team's last match (all 48 teams).
  Source: `data-sources/world_cup_2026_last_matches_cazetv.json`, from the playlist
  https://www.youtube.com/playlist?list=PLsFWLnYCEXEVWs5wf60vfwUU4FaOEre3D

## Scoring
10 rounds. Correct = +100, or +200 when the streak was already 3+. Wrong resets the streak.

## Analytics
Google Analytics (gtag) events: `game_start`, `answer`, `game_complete`, `language_switch`.

## Design
Figma: https://www.figma.com/design/aTLk4itN8GExLuU8sp8GIj/WorldCup26-Game-Screens
