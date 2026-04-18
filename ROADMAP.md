# Santaleague — Roadmap

## Completed

### Fase 1 — Foundation UI
- [x] Login / auth flow
- [x] Register form
- [x] Layout protetto — navbar con avatar, link alle sezioni, logout
- [x] Homepage — dashboard con saluto, statistiche personali, prossima partita, ultime giornate

### Fase 2 — Gestione Partite
- [x] Lista match — `/match` con tutte le giornate
- [x] Dettaglio match — `/match/[id]` dinamico con tutti i game della giornata
- [x] Admin: crea partita — form per creare un `Match` con data, location, tipo
- [x] Admin: anagrafica campi — CRUD `Location`
- [x] Admin: aggiungi eventi — inserimento `GameDetail` (gol, ecc.)

### Fase 3 — Draft
- [x] Draft UI — `/match/[id]/draft` (admin only): assegnazione casuale utenti ai team
- [x] Seed dati di test
- [x] Gestione team — visualizzazione roster e capitano

### Fase 4 — Classifiche & Statistiche
- [x] Classifica — punti per utente aggregati dai `GameDetail`
- [x] Profilo giocatore — storico personale
- [x] MVP board

---

## Fase 5 — Roles & Permissions

> Introduce a three-tier permission system: ADMIN > MODERATOR > USER.

- [x] Add `MODERATOR` to `UserRole` enum in Prisma schema
- [x] Update `middleware.ts` and all server actions to check role correctly
- [x] Admin panel: user management table — change roles, view all users
- [x] Moderator can: create/edit matches, create/edit locations, manage games and game events within a match
- [x] Moderator cannot: manage users, access admin-only settings
- [x] UI: show role badge on profile and admin/moderator panels
- [x] Gate all existing admin server actions behind `ADMIN | MODERATOR` where appropriate

---

## Fase 6 — Point System Redesign

> Simplify scoring: Goals + Win bonus. Remove Assist, YellowCard, RedCard from point calculations.

- [x] Remove `Assist`, `YellowCard`, `RedCard`, `Substitution` from `GameEventType` enum (keep `Goal`, `Penalty` as event type for tracking only — no points)
- [x] Update `POINTS` map in `data/stats.ts`: Goal = 3pts, Win bonus = +1pt per game won for all players on winning team
- [x] Add game result tracking: when a game is marked COMPLETED, store winning team on the `Game` model (add `winner_team_id` field)
- [x] Recalculate leaderboard to use new formula: `(goals × 3) + (wins × 1)`
- [x] Update all stat display components and dashboard to reflect new system
- [x] Update seed script with new event types

---

## Fase 7 — Seasons

> Matches belong to a Season. Leaderboards and stats are season-scoped. Career totals persist.

### Schema
- [x] Add `Season` model: `id`, `name`, `start_date`, `end_date`, `status (ACTIVE | COMPLETED)`, `champion_id`
- [x] Add `season_id` foreign key to `Match`
- [x] Ensure all stat queries can be filtered by `season_id` (leaderboard, profile, MVP board)

### UI
- [x] Season selector dropdown on leaderboard and stats pages
- [x] Admin/Moderator: create and manage seasons (name, start date, end date)
- [x] Auto-close season when `end_date` is reached (on-demand admin action via `closeSeason`)
- [x] Season archive page — `/season` lists all seasons with champion and date range

### Season Recap Page (`/season/[id]`)
- [x] Visual podium (1st / 2nd / 3rd place)
- [x] Top scorer, most wins (shown in full leaderboard table)
- [ ] Best rating, best GK rating *(blocked on Fase 8 — ratings not yet implemented)*
- [ ] Most improved player *(blocked on Fase 8)*
- [x] "Champion" crown displayed on winner's profile card

---

## Fase 8 — Player Rating System

> After each game, players rate each other 1–10. Ratings are anonymous. Captains must rate their teammates (mandatory). Ratings can be tagged as Field or Goalkeeper performance.

### Schema
- [x] Add `GameRating` model: `id`, `game_id`, `rater_id`, `rated_player_id`, `score (1–10)`, `role (FIELD | GOALKEEPER)`, `created_at`
- [x] Unique constraint: one rating per `(game_id, rater_id, rated_player_id, role)` pair
- [x] Captain derived from `TeamMember.is_captain`

### Rating Flow
- [x] After match is marked COMPLETED, rating windows auto-open for all games
- [x] Rating page `/match/[id]/rate`: list all players in the match, rate each 1–10 with Field/GK toggle
- [x] Prevent self-rating
- [x] Show "rating pending" banner on dashboard if player has unsubmitted ratings
- [x] Close rating window after 48h (checked at read time) or admin manually closes it
- [ ] Mandatory captain rating: captain cannot submit without rating all teammates *(partially enforced — all players must rate everyone before submit is enabled)*

### Aggregation
- [x] `avg_field_rating` and `avg_gk_rating` per player — computed at query time
- [x] Career averages in `getPlayerProfile`
- [x] Season averages in `getLeaderboard`

---

## Fase 9 — Player Level System

> A single "level" score per player derived from their stats. Used for balanced draft.

### Formula (tunable by admin)
```
Level = (avg_field_rating × 0.50) + (win_rate × 10 × 0.30) + (goals_per_game × 10 × 0.20)
```
- Level is a float 0–10, displayed as a tier badge
- Tiers: Bronze (0–3), Silver (3–5), Gold (5–7), Platinum (7–9), Legend (9–10)

### Implementation
- [x] `getPlayerLevel(userId, seasonId?)` function in `data/stats.ts`
- [x] Level displayed on player profile, leaderboard, and draft screen
- [x] Level history chart on player profile (per season) — bar chart with recharts, one bar per completed season
- [x] Admin panel: level formula weights configurable via sliders (stored in `LevelFormula` table, admin-only)

---

## Fase 10 — Smart Balanced Draft

> Replace random draft with algorithm that splits players into balanced teams using player levels.

### Algorithm
- [x] Fetch all `MatchParticipant` entries for the match, load their `level` score
- [x] For 2-team match (10 players): use a greedy balancing algorithm (sort by level desc, snake-draft into two teams)
- [x] For 3-team tournament (15 players): extend snake-draft to 3 buckets
- [x] Compute predicted team strength delta — show balance score on draft screen
- [x] Admin/Moderator tweak interface: drag-and-drop player between teams after auto-draft
- [x] Lock draft: once confirmed, prevent further changes (`draft_locked` flag on Match)
- [x] Draft history: locked draft result permanently visible at `/match/[id]/draft`

### Schema
- [x] Add `strength_at_draft` (Float) to `DraftPick` — snapshot of player level at draft time
- [x] Add `team_balance_score` to `Match` — stored after draft is confirmed

---

## Fase 11 — Enhanced Player Profiles

> Rich public profile pages for every player.

- [x] `/player/[id]` — public profile with: avatar, name, level badge, tier, career stats (goals, wins, avg rating field + GK)
- [x] Match history table: date, location, team, goals, rating received, win/loss
- [x] Season-by-season breakdown accordion
- [x] Rating trend sparkline chart (last 10 games)
- [x] Head-to-head record vs other players (games on same team vs opposing team)
- [x] All players list page `/players` with search, filter by tier, sort by level/goals/rating

---

## Fase 12 — Badges & Achievements

> Automatic badges awarded at season end and for career milestones.

### Season-end badges (auto-awarded when season is closed)
- [x] `Top Scorer` — most goals in season
- [x] `Most Wins` — highest win count
- [x] `Best Field Rating` — highest avg field rating (min 5 games)
- [x] `Best GK Rating` — highest avg GK rating (min 5 games)
- [x] `Most Improved` — biggest level gain vs previous season
- [x] `Season Champion` — player on the top of the final leaderboard

### Career milestone badges
- [x] `First Goal` — scored first goal
- [x] `Hat Trick` — 3 goals in a single game
- [x] `10 Matches` / `50 Matches` / `100 Matches`
- [x] `Perfect 10` — received a 10/10 rating
- [x] `Ironman` — attended 5/10/20 consecutive match days

### Implementation
- [x] `Badge` model: `id`, `key`, `name`, `description`, `icon_url`, `type (SEASON | CAREER)`
- [x] `UserBadge` model: `id`, `user_id`, `badge_id`, `awarded_at`, `season_id?`
- [x] Badge display on player profile (icon grid with tooltip)
- [x] Badge award logic runs on season close and on relevant stat thresholds
- [x] Rare badge highlight (animated border for special achievements)

---

## Fase 13 — Admin Dashboard & Analytics

> Central hub for admins with aggregate analytics across the league.

- [x] `/admin` redesigned as a proper dashboard with tabs: Users, Matches, Seasons, Settings
- [x] KPI cards: total players, matches this season, avg goals/match, avg player rating
- [x] Activity chart: matches per month (bar chart)
- [x] Top players widget (goals, rating, level)
- [x] Match completion rate (scheduled vs completed)
- [x] Level formula config UI — sliders for weighting Goal / Win / Rating contributions
- [x] Export: download season stats as CSV

---

## Fase 14 — Match Day UX

> Streamlined experience for match days, from signup to post-game ratings.

- [ ] Match day flow: Join → Draft → Play → Rate → Leaderboard update
- [ ] `/match/[id]` redesigned as a match day hub with tabs: Info, Draft, Games, Rate, Summary
- [ ] Games tab: inline scoreboard — admin/moderator can add goals in real time during the match
- [ ] Scoreboard view (`/match/[id]/scoreboard`) — full-screen display mode (TV/big screen friendly), shows live scores, goal scorers, team names
- [ ] Match summary card shown after all games completed: winners, top scorer, best-rated player
- [ ] Countdown timer on scheduled match cards (shows "in 2 days", "tomorrow", "today")

---

## Fase 15 — PWA

> Make the app installable and mobile-optimized.

- [ ] Add `manifest.json` with app name, icons, theme color, display: standalone
- [ ] Register service worker for offline caching of static assets and last-visited pages
- [ ] `next-pwa` or manual service worker setup compatible with Next.js App Router
- [ ] Mobile-optimized layouts for match list, leaderboard, player profile, rating screen
- [ ] Add "Install App" prompt for first-time mobile visitors
- [ ] Test on iOS Safari and Android Chrome

---

## Fase 16 — SantaCoin *(low priority)*

> Virtual currency layer for fun betting and rewards. No real money.

- [ ] Add `santacoin_balance` (Int) to `User`
- [ ] `CoinTransaction` model: `id`, `user_id`, `amount`, `type (EARN | BET | REWARD)`, `description`, `created_at`
- [ ] Earn coins: +10 for playing a match, +5 for a win, +20 for MVP, +5 for submitting ratings
- [ ] Bet system: before a match starts, players can bet coins on which team wins a game
- [ ] `MatchBet` model: `id`, `user_id`, `game_id`, `predicted_winner_team_id`, `amount`
- [ ] Bet resolution: winning bets paid out at 2x on match completion
- [ ] SantaCoin leaderboard `/coins` — richest players, biggest wins
- [ ] Coin balance shown in navbar
- [ ] Admin can grant/revoke coins manually
