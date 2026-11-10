# Hive v1 — build plan

Hive is a personal "daily spin" app. It pulls today's and overdue Todoist tasks onto a honeycomb board, lets you add Hive-only tasks, and when you can't decide, a pixel bee darts from cell to cell and lands on one.

Design reference (canvas, page "v2 · daily spin", rows "Terminal" and "K · desktop"): https://claude.ai/artifact/JeUH14AFjZWvHV5uncE1Yi
The chosen design is **K: wrist unit + flight log** (mobile) and **K desktop**. Everything below describes K.

---

## 0. Hard rules

1. **Todoist is read-only.** Hive never creates, edits, completes, moves or deletes anything in Todoist. The API client only exposes `GET` and throws on any other method (see §4). No Todoist SDK. This is the owner's explicit, permanent requirement.
2. **Sync only adds.** Syncing pulls Todoist tasks that aren't already on the board. It never removes or changes Hive-only tasks.
3. The token lives only on the device (secure storage on native, `localStorage` on web). Never logged, never sent anywhere except `api.todoist.com`.

## 1. Scope

**In v1**
- One screen, responsive: mobile layout (< 900px wide) and desktop layout (≥ 900px).
- Board of today + overdue Todoist tasks (all projects, including Work) plus Hive-only tasks.
- Spin: bee animation, flight log, landing actions.
- TODAY list: include/exclude toggle per task, add Hive task, delete Hive task, Sync.
- HISTORY: past landings with time; each entry has `DEL` to remove it from Hive's history (owner's request; never touches Todoist).
- Footer meter + DONE count for today.
- First-run token setup; Demo mode with sample data when there's no token.

**Not in v1** (keep the code open to them, don't build them)
- Spin modes from v1 designs (Swarm / Waggle / Forage), queen/quests, board of all areas, AI cross-pollination, ABCD time-of-day weighting, replacing Todoist, notifications, accounts/sync between devices.

## 2. Stack

- **Expo (SDK latest stable) + TypeScript**, `blank-typescript` template, Expo Router not needed (single screen + a setup modal).
- `react-native-svg` — hexes, edges, trail, pixel bee.
- Bee movement: plain JS timers (`setTimeout`) play the `spinPlan` step by step. No `react-native-reanimated` in v1. The motion is stepped anyway, and this avoids Reanimated+SVG problems on web. The landing glow can be a simple RN `Animated` opacity fade.
- `@react-native-async-storage/async-storage` — Hive tasks, history, per-day state.
- `expo-secure-store` — token on iOS/Android (fallback to AsyncStorage on web).
- `expo-haptics` — thud on landing (native only).
- `expo-font` + `@expo-google-fonts/vt323` + `@expo-google-fonts/share-tech-mono`.
- `expo-linking` — "Open in Todoist".
- Tests: `jest-expo` + `@testing-library/react-native`.
- Targets: Android (owner's phone), web (desktop + quick previews). iOS should work but isn't a priority.
- **Android delivery:** EAS Build, `preview` profile → standalone APK (`eas.json` in repo; owner runs `eas build -p android --profile preview`).
- **Web delivery:** `npx expo export -p web` → GitHub Pages, deployed by a GitHub Action on push to `main` (`EXPO_BASE_URL=/hive` → `experiments.baseUrl` via `app.config.ts`). Static only; the browser calls `api.todoist.com` directly.
- **Desktop app:** installable PWA (`public/manifest.json` + icons, linked from `public/index.html`). Electron/Tauri only if the PWA falls short (tray, global hotkey, launch at login).

## 3. Folder structure

```
app/                       (or App.tsx if not using a router)
src/
  todoist/
    client.ts              GET-only fetch wrapper (+ guard)
    api.ts                 getTodayTasks, getProjects, getCompletedToday
    colors.ts              Todoist colour name -> hex, brighten for dark bg
    types.ts
  domain/
    types.ts               Flower, HiveTask, Landing, DayState
    sync.ts                mergeTodoist(existing, incoming) — add-only
    hexLayout.ts           seeded random blob layout + neighbours
    edges.ts               which cell sides get a project border
    spinPlan.ts            hop sequence + timings
  store/
    storage.ts             AsyncStorage/SecureStore wrappers + keys
    useHive.ts             reducer + effects (load, sync, spin, add, done…)
  ui/
    theme.ts               tokens (§7)
    Screen.tsx             picks MobileLayout / DesktopLayout by width
    MobileLayout.tsx
    DesktopLayout.tsx
    Comb.tsx               SVG board (cells, edges, trail, bee)
    PixelBee.tsx
    FlightLog.tsx
    TodayList.tsx
    History.tsx
    ActionRow.tsx          OPEN/DONE · REMOVE · AGAIN
    Footer.tsx             meter + DONE count
    Tabs.tsx               bracket tabs
    Crt.tsx                scanlines + vignette + bezel overlay
    TokenSetup.tsx
  demo/sampleData.ts
docs/PLAN.md
```

Keep `domain/` pure (no React, no I/O) so it's fully unit-tested.

## 4. Todoist (read-only)

Base: `https://api.todoist.com/api/v1`. Auth header: `Authorization: Bearer <token>`. CORS is allowed from any origin, so the web build can call it directly.

> Verify each path and response shape against the official v1 reference before relying on it (https://developer.todoist.com/api/v1/). If a path differs, fix it in `api.ts` only.

| Purpose | Request | Notes |
|---|---|---|
| Today + overdue | `GET /tasks/filter?query=today%20%7C%20overdue&limit=200` | Paginated: `{ results, next_cursor }`. Loop until `next_cursor` is null. |
| Projects (name + colour) | `GET /projects?limit=200` | Paginated. `color` is a name like `magenta`, `charcoal`. |
| Completed today (for DONE count) | `GET /tasks/completed/by_completion_date?since=<local midnight ISO>&until=<now ISO>` | Returns `{ items, next_cursor }`. Count only. If this endpoint misbehaves, ship without it and count Hive DONEs only. |

**client.ts guard (required):**
```ts
const ALLOWED = new Set(['GET']);
export async function todoistGet<T>(path: string, token: string, params?: Record<string,string>): Promise<T> {
  // build URL, fetch with method 'GET' only
}
// No other export may call fetch against api.todoist.com.
```
Add a unit test that greps/imports `src/todoist` and asserts no `method:` other than `'GET'` and no `POST|PUT|PATCH|DELETE` string appears. Cheap, and it protects rule 0.1.

Map a Todoist task to a `Flower`:
- `id` = `todoist:<task.id>`, `title` = `task.content`, `projectId`, `projectName`, `projectColor` (from projects), `labels`, `due` = `task.due?.date`, `daysLate` = days between due date and today (local) if > 0.
- Subtasks: include them as their own flowers (they come back from the filter if due).

**Open in Todoist:** web `https://app.todoist.com/app/task/<id>`; on Android try `todoist://task?id=<id>` first and fall back to the web URL (verify the deep link on device).

## 5. Data model

```ts
type Source = 'todoist' | 'hive';

interface Flower {            // one cell on the board
  id: string;                 // 'todoist:123' or 'hive:<uuid>'
  source: Source;
  title: string;
  projectKey: string;         // todoist project id, or 'hive'
  projectName: string;        // 'Mega Dog', 'Inbox', 'Hive'
  color: string;              // display hex (already brightened)
  daysLate?: number;
  goneFromTodoist?: boolean;  // was synced earlier, no longer returned (done/rescheduled in Todoist)
}

interface HiveTask { id: string; title: string; createdAt: string; doneAt?: string }   // persists across days

interface Landing { flowerId: string; title: string; projectName: string; color: string; at: string }

interface DayState {          // keyed by local date 'YYYY-MM-DD', resets each day
  date: string;
  todoistFlowers: Flower[];   // what's been synced today
  excluded: string[];         // flower ids toggled off / removed for today
  hiveDone: number;           // Hive tasks marked DONE today
  log: string[];              // flight log lines (cap 200)
  seed: number;               // board layout seed (Shuffle changes it)
}
```

Storage keys: `hive.token`, `hive.tasks` (HiveTask[]), `hive.history` (Landing[], cap 500), `hive.day` (DayState).

**Day rollover:** on app open / focus, if `day.date !== today`, start a fresh DayState (empty todoistFlowers, empty excluded, hiveDone 0, new seed) and run a sync. Hive tasks that aren't done carry over automatically because they live in `hive.tasks`.

## 6. Behaviour

### Sync (`domain/sync.ts`, add-only)
```
mergeTodoist(current: Flower[], incoming: Flower[]): { flowers, added: number, gone: number }
- For each incoming flower not in current (by id): append.
- For each current Todoist flower: if present in incoming, refresh title/colour/daysLate; if absent, set goneFromTodoist = true (keep it, dim it, exclude from spins).
- Never touch Hive flowers.
```
Runs automatically on app open and on day rollover; manually via [ SYNC TODOIST ]. Log: `HH:MM > sync todoist ... +N new, M hive kept`.

### Board (`domain/hexLayout.ts`)
- Pointy-top hexes, odd-row offset coordinates. Neighbour table:
  - even row: `(c+1,r) 0°, (c,r-1) -60°, (c-1,r-1) -120°, (c-1,r) 180°, (c-1,r+1) 120°, (c,r+1) 60°`
  - odd row: `(c+1,r) 0°, (c+1,r-1) -60°, (c,r-1) -120°, (c-1,r) 180°, (c,r+1) 120°, (c+1,r+1) 60°`
- One cell per active flower (excluded flowers keep their cell, dimmed). Start at (0,0); repeatedly add a frontier cell chosen with weight = (number of filled neighbours)³ — compact blob, no gaps. **Then carve the blob into project territories (owner's decision):** biggest project first, start in the unclaimed cell with the fewest unclaimed neighbours, grow into touching unclaimed cells weighted by (territory neighbours)³; shuffle flowers within their territory. A territory may rarely end up in two pieces if boxed in. All randomness from a seeded PRNG (mulberry32) using `day.seed`, so the layout is stable all day until Shuffle. **Full re-layout (owner's decision):** the layout is a pure function of `(seed, flowers)` and is recomputed whenever the flower set changes (add / sync / delete). Cells may move when that happens; that's accepted. Don't store cell positions.
- Cell width 150 (desktop) / 112 (mobile) in board units; whole board scales down to fit its area (never up). Lots of tasks → smaller cells (owner OK'd this).
- **Edges:** for each cell side, draw a border on that cell's side if the neighbour is empty or a different `projectKey`. Colour = the cell's project colour; 3–3.5px, slight glow. Same-project neighbours share no border, so projects form territories.

### Spin (`domain/spinPlan.ts`)
- Eligible = flowers not excluded and not gone.
- Winner = uniform random from eligible (v1; weighting comes later).
- Hops: 15–20 random hops over **eligible cells only** (the bee never visits excluded/gone cells); each hop 65% chance to an eligible neighbour, otherwise any eligible cell; never the same cell twice in a row (including the cell the bee sits on after AGAIN). One eligible flower → fly straight there. Then, 50% of the time (owner's decision: not every spin), one fake-out hop onto a neighbour of the winner; then the winner.
- Gap after hop k: `70 + 520 * (k/n)^2.4` ms; fake-out pause 820ms; final settle 520ms. Bee move duration = `min(prevGap*0.85, 460)` ms, **stepped** (6 steps) for the pixel feel, driven by JS timers (see §2). Bee starts from the SPIN button. The player must cancel its timers on unmount and on a new spin.
- Each hop appends `      hop NN  <title>` to the log; trail = last 5 hops as a dotted line.
- On landing: log `HH:MM > LANDED: <TITLE> [<PROJECT>]` (rendered inverse), push to history, haptic `Heavy` on native.
- Pure function returns `{ winner, hops: [{ cellIndex, delayMs, moveMs }] }`; the UI just plays it. Unit-test: winner always eligible, last hop = winner, no consecutive repeats, works with 1 and 2 eligible flowers, returns null with 0.

### Landing actions
- Todoist winner: **OPEN** (filled) · REMOVE · AGAIN.
- Hive winner: **DONE** (filled) · REMOVE · AGAIN.
- REMOVE = exclude from today's spin only (never touches Todoist). Log `> rm <title> --today`.
- DONE (Hive only) = set `doneAt`, `hiveDone++`, exclude. Log `> done <title>`.
- AGAIN = spin again.

### While the bee is in flight
TODAY edits (toggle, ADD, DEL, SYNC) and SHUFFLE are disabled until it lands (owner's decision). Add/delete/sync/shuffle re-lay out the board, and excluding the chosen winner mid-flight would land on an excluded flower.

### Shuffle
A small `[SHUFFLE]` control: mobile in the middle of the `FLWR · LATE` stats row; desktop in the header next to the stats. New seed for today → new layout. Log: `HH:MM > shuffle comb ... ok`.

### TODAY list
- Rows: `[x]`/`[ ]` toggle · TITLE · `!2D` late tag · project code (3 letters, in project colour) · `DEL` for Hive tasks.
- Under the list: `> ADD: [input] [OK]` (OK is a boxed button), then `[ SYNC TODOIST ]`, then the note `PULLS NEW TASKS ONLY · HIVE TASKS KEPT`.

### Counts
- Header/stats: `FLWR NN` (eligible count), `LATE NN`.
- Footer right: `DONE NN` = Todoist completed today (from §4) + `hiveDone`.
- Footer middle: meter, one block per flower, filled if included, in its project colour.
- **No clocks anywhere** except timestamps inside the log and history.

## 7. Visual spec (K)

Tokens (`ui/theme.ts`):
```
bg        #0B0600
screen    #FFA526   (all text, frames, hex rings, bee)  rgb 255,165,38
dim       screen @ 0.32 (idle hex rings), @ 0.6–0.7 (secondary text)
hiveColor screen    (Hive-only tasks use the screen colour)
fonts     display: VT323   body/log: Share Tech Mono
glow      text-shadow 0 0 6px rgba(screen,0.55)
```
Project colours: map Todoist names → hex, then brighten colours too dark for a near-black background: relative luminance < 0.32 **and** HSL lightness < 0.6 → raise lightness to 0.6, keeping hue/saturation (charcoal #808080 → #999999; magenta stays #E05194 as in the design).
`berry_red #b8256f, red #db4035, orange #ff9933, yellow #fad000, olive_green #afb83b, lime_green #7ecc49, green #299438, mint_green #6accbc, teal #158fad, sky_blue #14aaf5, light_blue #96c3eb, blue #4073ff, grape #884dff, violet #af38eb, lavender #eb96eb, magenta #e05194, salmon #ff8d85, charcoal #808080, grey #b8b8b8, taupe #ccac93`

CRT overlay (pointer-events none, above everything): horizontal scanlines (1px dark every 3px, ~26% black), radial vignette to ~55% black at the edges, rounded bezel (radius ~30) with a faint inner glow. On native, render scanlines as an SVG pattern or a repeated image; don't block touches.

Cells: hex ring 1.5px in `dim`; inner fill bg; label VT323 uppercase (21px mobile / 26px desktop in board units); late tag `!2D`.
- Bee on cell: ring full `screen`, faint fill.
- Winner: solid `screen` fill, label in `bg` (inverse video), glow; all other cells fade to 45%.
- Excluded: 30% opacity, struck-through label.

Pixel bee: 11×7 grid (scale 3–4px), crisp edges: two wing blocks (55% opacity), 8×5 body with two bg-colour stripes, 2×3 head with a bg eye pixel, 1px stinger. Flip horizontally when flying left. Counter-scale so it stays the same size when the board shrinks.

### Mobile layout (390×844 reference)
Top → bottom: bracket tabs `SPIN · TODAY · LOG` (active tab boxed, line underneath) · stats `FLWR 07  LATE 03` · comb (fills ~330px tall) · FLIGHT.LOG box (~206px, title on the frame; on landing the winner's name shows big at its top) · `▶ SPIN` bar (or the 3 action buttons) · footer `HIVE·OS | meter | DONE 02`.
TODAY and LOG tabs replace the comb/log area.

### Desktop layout (≥ 900px)
Header: `HIVE·OS // DAILY SPIN` left, `FLWR · LATE · DONE` right, rule under it.
Left: big `COMB.SYS` window (status on frame: ● READY / ◌ IN FLIGHT / ■ LANDED), comb centred, SPIN bar / action row under it.
Right column: list window with frame tabs `TODAY · NN | HISTORY`, then `FLIGHT.LOG` window (~290px).
Footer: `HIVE·OS v2 | meter | DONE NN`. Below ~1000px the right column wraps under the comb.

### Token setup (first run)
Same terminal look. `> TODOIST TOKEN:` input, `[ CONNECT ]`, a line explaining where to find the token (Todoist → Settings → Integrations → Developer), and `[ DEMO MODE ]` to run on sample data. Validate the token with one `GET /projects?limit=1`. A `CFG`/settings entry (small, in the footer) lets you replace or forget the token and toggle haptics.

## 8. Milestones (each ends runnable and committed)

1. **Scaffold** — Expo TS app, fonts load, theme + CRT overlay on an empty screen, web + Android run. ESLint/Prettier, jest-expo set up. `eas.json` (preview → APK), GitHub Pages deploy workflow, PWA manifest + icons.
2. **Domain** — `hexLayout`, `edges`, `spinPlan`, `sync`, Todoist colour map, all unit-tested. GET-only guard + its test.
3. **Static board** — `Comb` renders sample data with project edges; responsive Mobile/Desktop shells; TODAY/LOG/HISTORY lists from sample data.
4. **Spin** — bee animation playing a `spinPlan`, trail, log lines, landing state, action row, haptics.
5. **Persistence** — Hive tasks add/delete/done, history, DayState + rollover, Shuffle.
6. **Todoist** — token setup, read-only client, sync (add-only), completed-today count, Open in Todoist, demo mode, error states (offline / bad token → log line + keep last data).
7. **Polish** — empty states (`NO FLOWERS. ADD ONE OR SYNC.`), 1-flower spin, very long titles (truncate in cells, full in list), 20+ flowers (board shrinks), reduced-motion setting (instant landing), accessibility labels on every control.

**Done when:** on Android and desktop web, with a real token, today+overdue tasks appear with project-coloured borders, a spin plays and lands, actions work, Hive tasks survive an app restart, and there is provably no non-GET call to Todoist.

## 9. Testing

- Unit: everything in `domain/` + `todoist/colors.ts` + the GET-only guard.
- Component: TodayList toggles/add/delete; ActionRow shows DONE vs OPEN correctly.
- Manual checklist per milestone on Android device + Chrome desktop + Chrome mobile emulation (390×844).
- `api.ts` gets a fixture-based test (recorded JSON shapes), no live calls in CI.
