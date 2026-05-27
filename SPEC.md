# World Cup 26 — Project Spec for Claude Code

## What this is
A single-page web game where users guess which country a football player
represents. Built with plain HTML, CSS and vanilla JavaScript. No framework,
no build step, no backend.

---

## File structure
```
worldcup26/
├── index.html        ← the entire game (HTML + CSS + JS in one file)
├── SPEC.md           ← this file
└── README.md         ← for GitHub
```

---

## Tech stack
- **Frontend:** Plain HTML + CSS + Vanilla JS (no React, no Vue)
- **Fonts:** Google Fonts — Barlow Condensed + Barlow
- **Photos:** Wikipedia REST API (free, no auth needed)
  - `https://en.wikipedia.org/api/rest_v1/page/summary/{wiki_title}`
  - Returns `thumbnail.source` — the player headshot
- **Flags:** Inline SVG drawn in code (no external CDN needed)
- **Club badges:** Inline SVG drawn in code (stylised, not trademarked crests)
- **Hosting:** Vercel (free tier, deploy from GitHub)
- **Ads:** Google AdSense — placeholders already in layout (300×600 + 300×250)

---

## How the game works
1. User lands on **Welcome screen** — sees title + 3 difficulty cards
2. User clicks a difficulty card → game starts immediately (no button)
3. Each round shows a **player name + position**
4. A **? card** hides the player photo (blurred until answered)
5. User picks one of **4 country options** (flags + country name)
6. On answer:
   - Card flips to reveal player photo
   - Club badge fades in (bottom-right of photo)
   - Country + flag reveals below the player name
   - Orange **Next** button appears
7. After 20 rounds → **Results screen** with score + two buttons:
   - "Play Again" (same difficulty)
   - "Change Difficulty" (back to welcome)
8. During game: **breadcrumb** below header shows `← Difficulty / Stars Only`
   — clicking it goes back to welcome screen

---

## Scoring
- Correct answer: **+100 pts**
- Streak of 3+: **+200 pts** (streak bonus)
- Streak resets on wrong answer

---

## Difficulty levels
| Key      | Label        | Players shown         |
|----------|--------------|-----------------------|
| `stars`  | Stars Only   | difficulty = 1 (top stars, 20 players) |
| `mixed`  | Mixed        | difficulty ≤ 2 (stars + known players, 43 players) |
| `all`    | All Players  | all difficulties (56 players) |

---

## Player data structure
Each player in the `PLAYERS` array:
```js
{
  name: "Lionel Messi",
  country: "Argentina",
  code: "ar",           // ISO flag code
  pos: "Forward",       // position label
  club: "Inter Miami",  // current club (for badge)
  d: 1,                 // difficulty: 1=stars, 2=mixed, 3=all
  wiki: "Lionel_Messi"  // Wikipedia page title for photo API
}
```

---

## Qualified countries (answer options)
Wrong answer options are pulled ONLY from `QUALIFIED_COUNTRIES` array —
all 43 confirmed FIFA World Cup 2026 nations. Non-qualifiers (Italy, Poland)
are excluded from both players and answer options.

---

## No-repeat rule
Each player appears **at most once per session**. Queue is built by shuffling
the pool and slicing to 20 — guaranteed unique.

---

## Photo system
- Fetched async from Wikipedia API using `wiki` field
- Cached in `photoCache` object to avoid repeat requests
- Shown ONLY after user answers (card flip reveal)
- Falls back to person icon SVG if no photo found
- **Note:** Wikipedia API is blocked in Claude.ai sandbox preview
  but works perfectly on any deployed site (Vercel, Netlify, etc.)

---

## Club badge system
- Each club has a hand-drawn SVG badge in `CLUB_BADGES` object
- Uses real club colours, distinct visual design per club
- NOT copies of trademarked crests — original stylised interpretations
- Fades in on photo back-face 750ms after card flip

---

## Ad slots
Two AdSense placeholders in the right column:
- 300×600 (tall banner)
- 300×250 (medium rectangle)
Right column hides on mobile (≤900px).

To activate: replace `.ad-slot` divs with real AdSense `<ins>` tags
after AdSense approval.

---

## What to do on June 2, 2026
1. Go to https://www.fifa.com — all 48 squads published officially
2. Ask Claude Code:
   > "Read the PLAYERS array in index.html. Replace it with the full
   > official FIFA World Cup 2026 squads. For each player include name,
   > country, ISO code, position, club, difficulty level (1/2/3), and
   > Wikipedia page title. Source from FIFA.com and cross-check with
   > Wikipedia. Keep all non-qualified nations out."
3. Claude Code will rebuild the array with 1000+ players

---

## Planned next features (ask Claude Code to build these)
- [ ] Share score button (WhatsApp, Twitter/X)
- [ ] Timer mode (15 seconds per question)
- [ ] Leaderboard (localStorage for personal best)
- [ ] Privacy Policy page (required for AdSense)
- [ ] Mobile layout polish
- [ ] Sound effects (correct/wrong)
- [ ] Confetti on perfect score

---

## How to deploy to Vercel
1. Push `index.html` to GitHub repo
2. Go to vercel.com → Import project → select repo
3. Click Deploy (Vercel auto-detects plain HTML)
4. Site is live in ~30 seconds
5. Every `git push` auto-publishes update

---

## How to work with Claude Code
Open VS Code terminal in the worldcup26 folder and type:
```
claude
```
Then describe what you want in plain English. Examples:
- "Add a share button that lets users share their score on WhatsApp"
- "Add a 15-second timer to each question"
- "Add 10 more players from confirmed WC2026 squads"
- "Create a privacy policy page"
- "Replace the AdSense placeholder divs with this AdSense code: [paste code]"

