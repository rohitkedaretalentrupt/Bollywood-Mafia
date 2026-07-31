# 🎬 Bollywood Mafia

**Find the villain before the movie ends.**

A cinematic, mobile-first social-deduction game for the browser. A villain has infiltrated a
Bollywood movie set; every player gets a secret role, and the crew has to identify the saboteur
before the production is destroyed. Think Mafia × Among Us × Town of Salem, with an award-show
paint job.

No sign-in. No backend. No asset downloads — even the music and sound effects are synthesised in
the browser.

---

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>). Vite is configured with
`server.host = true`, so the dev server is also reachable from your phone on the same Wi-Fi at
`http://<your-computer-ip>:5173`.

Requires **Node.js 18+**.

```bash
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit only
```

---

## Deploying

The build is a plain static bundle, so any static host works:

```bash
npm ci && npm run build   # outputs dist/
```

Point the host at `dist/`. There is no router and nothing server-side, so no SPA rewrite rules are
needed.

> **If you deploy to a sub-path** — e.g. a GitHub Pages *project* site at
> `user.github.io/bollywood-mafia/` — set `base` in `vite.config.ts` to match, or `/assets/…` will
> resolve against the domain root and the page will load blank:
>
> ```ts
> export default defineConfig({ base: '/bollywood-mafia/', /* … */ })
> ```
>
> Root domains and the Netlify / Vercel / Cloudflare Pages defaults need no change.

The only external request the app makes is Google Fonts (Bebas Neue + Inter). If that is blocked the
layout falls back to Impact / system sans and everything still plays. There is no service worker, so
a cold load needs network — after that the game runs entirely client-side.

---

## Game modes

### Solo mode

You against a cast of AI actors. Pick a cast size (5–12) and your role is dealt honestly — you can
absolutely draw the Villain.

### Party mode (pass-and-play)

Create a room, get a six-digit code (e.g. `483921`), and read it out to the people around you. Each
player taps **Join Room** on the same device and enters the code to claim a seat — or the host adds
them directly from the lobby. Any empty seats are filled with AI actors.

During private phases (role reveal, night moves, private dawn reports, voting) the screen shows a
**"pass the device"** privacy gate, so nothing secret renders until the right person confirms they
are holding the phone.

> **On the room code:** the game has no server, so rooms live in `localStorage` and sync across tabs
> of the same browser via `BroadcastChannel`. The code is a real gate for pass-and-play on one
> device (and works across two tabs/windows on one machine) — it is not internet matchmaking.

---

## The cast

| Role | | Team | Ability |
| --- | --- | --- | --- |
| Director | 🎬 | Studio | Each night, investigate one player and learn whether they are the Villain. |
| Hero | 🕶️ | Studio | Each night, protect one player. If the Villain strikes them, they survive. |
| Heroine | 💃 | Studio | Each night, read one player's aura — an ~80% accurate innocence check. |
| Choreographer | 🕺 | Studio | Each night, drag one player into rehearsal. Their night ability does nothing. |
| Paparazzi | 📸 | Studio | Each night, stake out one player and learn who they visited. |
| Audience | 🍿 | Studio | No night ability, full voice and full vote during the day. |
| Villain | 😈 | **Sabotage** | Each night, eliminate one player. Survive the vote. |

Villain count scales with the table: **1 villain** up to 6 players, **2** up to 11, **3** at 12.
Roles are dealt so there is always at least one Audience seat.

*(The spec lists 💃 for both Heroine and Choreographer; the Choreographer uses 🕺 here so the two
are distinguishable at a glance in the UI.)*

### Win conditions

- **Studio** wins when every villain has been voted off the set.
- **Villains** win when they equal the number of surviving non-villains…
- …or when the shoot runs out of days (`min(10, players + 2)` rounds). The movie wraps, ruined.

---

## Round structure

1. **Role reveal** — animated card flip, one player at a time in party mode.
2. **Night** — each night role picks a target. Resolution order: Choreographer blocks → Hero
   protects → Villain strikes → information roles read the aftermath.
3. **Dawn** — public headlines plus private reports (investigation results, auras, photographs).
4. **Day** — the continuity log publishes new clues, the AI cast argues in real time, and you can
   accuse, defend, claim your role or urge caution. 75-second clock, skippable.
5. **Vote** — every survivor votes. Animated tally; a tie means nobody is fired.
6. **Verdict** — the eliminated player's role is revealed to everyone.
7. Repeat until someone wins.

---

## Clues are honest

Every **public** clue on the continuity log is a logically *true* statement about the real game
state, generated from the resolved night:

- `at least one of A, B, C sabotaged a take` — the trio always contains a real villain.
- `security footage clears both A and B` — both are genuinely innocent.
- `the watchman counted N people moving` — that is the true number of night actions.
- `X never left their vanity van` — X really took no night action.
- `someone rattled X's door and walked away empty-handed` — X was the villain's target and survived.

That means the game is solvable. Cross-reference a couple of "one of these three" clues against a
cleared pair and you can name the villain outright — which is exactly what the smarter bots do.

### How much evidence you get

The log is deliberately stingy, and the amount of hard evidence per night is the game's balance
dial. It tracks **pressure** — surviving studio members per surviving villain, `(n - 2v) / v` —
which is what actually decides a game: the studio must land `v` correct lynches inside roughly
`n - 2v` rounds.

| Pressure | Meaning | Hard clues per night |
| --- | --- | --- |
| ≤ 1.75 | studio nearly out of road | 2 |
| ≤ 2.75 | even fight | 1 |
| > 2.75 | studio cruising | 1 half the time |

Because it reads the live board rather than the starting roster, it also adapts *inside* a game: a
studio that loses its Director early starts hearing from more witnesses. `clear-pair` is the rarest
clue precisely because it is the strongest — it collapses a trio straight into a name.

### Verified balance

Measured over 4,000 simulated bot-vs-bot games (500 per cast size):

```
studio win rate by cast size
   5p (1v)  █████████████████████·············  63%
   6p (1v)  ██████████████████████████········  79%
   7p (2v)  ████████████······················  37%
   8p (2v)  ██████████████████················  55%
   9p (2v)  █████████████████████·············  62%
  10p (2v)  ███████████████████████···········  69%
  11p (2v)  ███████████████████████···········  68%
  12p (3v)  ███████████████████···············  56%
                                       overall  61%
```

Six players with one villain is the gentle setting; seven with two is the mean one. The default solo
cast of 8 is a near coin-flip. The same run asserted ~757,000 invariants — every public clue was a
true statement, no game failed to resolve, and no bot ever made an illegal move.

---

## The AI cast

Each bot has a personality (`hot-headed`, `method actor`, `reserved`, `theatrical`,
`comic relief`) that drives how fast it grows suspicious, how much it talks, how readily it
believes claims, and how chaotic its votes are. On top of that each bot keeps:

- a **suspicion map** over every other player;
- a **fact log** of clues, votes, accusations, deaths and claims;
- **cleared** and **convicted** sets;
- a **deduction pass** that collapses "one of these three" facts against the cleared set — if two of
  a trio are proven innocent, the third gets convicted by name.

Behaviours that fall out of that model:

- Villain bots never accuse their accomplices, redirect at the most-trusted townsperson, target
  claimed power roles first, keep the town's favourite scapegoat alive, and will sometimes bandwagon
  onto a doomed ally to survive the round.
- A Director bot that finds a villain claims its role publicly and campaigns for the lynch.
- Bots hold grudges against whoever accuses them, and quietly grow suspicious of players who never
  speak.
- Hero bots rotate their protection and cover claimed power roles.

---

## Scoring & leaderboard

| Event | Points |
| --- | --- |
| Survive a night | +10 |
| Vote out a villain | +50 |
| Fire an innocent | −10 |
| Director finds a villain | +25 |
| Hero saves a life | +40 |
| Villain lands a kill | +20 |
| Studio win / Villain win | +150 / +220 |
| Alive at the wrap | +30 |

Wins, losses, villain wins, games played and best score are stored per player name in
`localStorage` (`bollywood-mafia:leaderboard`) and shown in the Hall of Fame.

---

## Tech

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS 3** for styling (custom `ink` / `crimson` / `gold` palette)
- **Framer Motion** for card flips, tallies, confetti, spotlights and phase transitions
- **Zustand** (with `persist`) for game state, settings and the leaderboard
- **Web Audio API** for a procedural suspense score and all sound effects — zero audio files

### Layout

```
src/
├── App.tsx                 phase router + audio bootstrap
├── main.tsx
├── index.css               Tailwind layers + cinematic utilities
├── types/game.ts           every shared domain type
├── data/                   roles, avatars, bot names & personalities, dialogue banks
├── engine/
│   ├── setup.ts            seat drafting, role dealing, villain intros
│   ├── clues.ts            truthful public clues + private role results
│   ├── ai.ts               bot memory, deduction, night choices, voting, dialogue
│   ├── resolve.ts          night resolution order
│   ├── winner.ts           vote tally, win conditions, final payout
│   ├── scoring.ts
│   └── util.ts
├── store/
│   ├── gameStore.ts        the whole game loop
│   ├── leaderboardStore.ts persisted records
│   ├── settingsStore.ts    sound + remembered identity
│   └── rooms.ts            localStorage room registry + BroadcastChannel sync
├── audio/sound.ts          synthesised SFX + procedural score
├── hooks/                  deadline countdown, interval, media queries
├── components/             player cards, role card, chat feed, clue log, handoff gate, effects
└── screens/                landing, create, join, solo setup, lobby, reveal,
                            night, day, vote, verdict, game over, leaderboard
```

---

## Accessibility & devices

- Mobile-first layout; tabbed day screen on phones, three-column on desktop.
- Safe-area padding for notched iPhones, `viewport-fit=cover`, no rubber-band scroll.
- `prefers-reduced-motion` disables particles, confetti and looping animations.
- Sound can be muted at any time from the speaker button; state persists.
- Keyboard focus rings preserved; modals close on `Escape`.
