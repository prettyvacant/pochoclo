# CLAUDE.md — Tutuca

This file helps Claude Code understand this project.

---

## What is this project?

**Tutuca** is a personal life organizer built as a single-file Progressive Web App (PWA).
It was created in Spanish by an Argentine woman from Florencio Varela — made with love in Berlin.

Live app: `https://prettyvacant.github.io/tutuca`

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript (no framework, no build step) |
| Database | Supabase (PostgreSQL via REST API) |
| Hosting | GitHub Pages |
| Offline | Service Worker (`sw.js`) |
| PWA | `manifest.json` + canvas-generated icon |

The entire app lives in **one file: `index.html`** (~2493 lines, ~146KB).
There is no `package.json`, no bundler, no transpiler.

---

## File structure

```
tutuca/
├── index.html      ← The entire app (HTML + CSS + JS)
├── sw.js           ← Service Worker for offline + auto-updates
├── manifest.json   ← PWA manifest
├── icon.png        ← App icon (512×512)
├── icon.svg        ← App icon (vector)
├── README.md       ← English documentation
└── CLAUDE.md       ← This file
```

---

## Architecture

### State management

All app state lives in a single `state` object (vanilla JS).
Persisted via `localStorage` (local) and Supabase (cloud sync).

```js
let state = {
  tab,              // active tab ID
  grupos,           // habit groups with items
  checks,           // date-based habit completions {dateKey: {itemId: bool}}
  vistaRut,         // 'hoy' | 'semana' — rutinas view
  editMode,         // boolean — routine edit mode
  semana,           // 0-3 — meal week selector
  meals,            // meal checkmarks by day
  verEsposo,        // boolean — show spouse's meal variant
  customMenu,       // custom meal overrides
  menuEditDia,      // string | null — editing meal day
  tareas,           // daily tasks by date key {dateKey: [{id, text, done}]}
  icalUrl,          // string — Google Calendar iCal URL
  gastosFijos,      // array — fixed monthly expenses
  sueldoBase,       // number — base salary for budget calculations
  showIngForm,      // boolean — income form open
  showFijForm,      // boolean — fixed expense form open
  showVarForm,      // boolean — variable expense form open
  vidaVista,        // 'menú' | 'compras' — menu sub-tab
  theme,            // 'slate'|'rose'|'violet'|'teal'|'amber'
  showThemePicker,  // boolean
  perfil,           // {nombre, emoji, año, email} | null
  showPerfil,       // boolean — profile editor open
  mes,              // number 0-11 — current calendar month
  diaSelec,         // number — selected calendar day
  showEvForm,       // boolean — event form open
  eventos,          // array — calendar events
  movs,             // array — financial transactions
  showMovForm,      // boolean
  finVista,         // 'resumen' — finance view type
  compras,          // array — shopping list items
  bienestar,        // {dateKey: {agua:0-8, sueno:5-10, animo:1-5}}
  notas,            // array — quick notes with dates
  contadores,       // array — countdown timers to events
  proyectos,        // array — projects with tasks, notes, status
  editProj,         // string | null — editing project id
  showNewProj,      // boolean — new project form open
  pronombre,        // 'ella'|'él'|'elle' — user pronouns
  idiomaAprender,   // 'en'|'de'|'es' — language being learned
  idiomaUsar,       // 'es'|'en'|'de' — app display language
  modoOscuro,       // 'auto'|'light'|'dark'
  proyVista,        // 'proyectos'|'trabajo' — projects sub-view
}
```

### Tab structure (current)

| Tab ID | Label | Render function | Content |
|---|---|---|---|
| `diario` | 📋 Diario | `renderDiario()` | Date + clock, daily tasks, wellness tracker, word of day |
| `rutinas` | 🏃 Rutinas | `renderRutinas()` | Habit tracker with daily/weekly views |
| `proyectos` | ✨ Proyectos | `renderProyectosTab()` | Project management + work routines |
| `finanzas` | 💰 Finanzas | `renderFinanzas()` | 50/30/20 budget, fixed expenses, transactions |
| `menu` | 🍽 Menú | `renderMenuTab()` | 4-week meal planning + shopping list |
| `notas` | 💭 Notas | `renderNotas()` | Quick notes/ideas |

> Note: Old tab IDs `trabajo`, `casa`, `vida`, `personal` are legacy — they redirect internally to the current tabs above.

### Rutinas habit categories

```js
{id:"salud",     label:"Salud & cuerpo",           color:"#b91c1c", emoji:"💊"}
{id:"movimiento",label:"Movimiento",                color:"#15803d", emoji:"🏋️"}
{id:"mente",     label:"Mente, estudio & escritura",color:"#1d4ed8", emoji:"📚"}
{id:"proyectos", label:"Proyectos",                 color:"#be185d", emoji:"✨"}
{id:"trabajo",   label:"Trabajo",                   color:"#0e7490", emoji:"💼"}
{id:"casa",      label:"Casa",                      color:"#b45309", emoji:"🏠"}
```

Each group holds items with frequency labels: `Diario`, `3x semana`, `Semanal`, `Mensual`.

### Rendering

Manual DOM rendering — no virtual DOM.
Every state change calls `save()` then `render()` which rebuilds the active tab.

```js
function render() {
  renderTabs();
  renderContent(); // calls the active tab's render function; wrapped in try-catch
}
```

### Storage

- `S.get(key)` / `S.set(key, value)` — localStorage JSON wrapper (note: was `LS` in older versions)
- `sbSave(userId, data)` / `sbLoad(userId)` — Supabase REST API
- `sbLoadAndMerge()` — loads remote data; migrates from old `_pochoclo` key to `_tutuca`
- `scheduleSbSave()` — debounced cloud save (2000ms after last change)
- Storage key format: `{email or nombre}_tutuca`

### DOM helpers

```js
const $ = id => document.getElementById(id)
const el = (tag, props={}, children=[]) // generic createElement wrapper
const div = (cls, children=[], style='') // shorthand div
const span = (text, style='')           // shorthand span
const btn = (text, cls, onclick, style='') // shorthand button
const pad = n => String(n).padStart(2,'0') // zero-pad
const uid = () => Math.random().toString(36).slice(2,8) // short unique ID
const mkKey = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}` // YYYY-MM-DD key
```

**Critical rule:** `children` must always be an **array**, never a plain string.
`el('div', {}, ['text'])` ✓
`el('div', {}, 'text')` ✗ — throws `children.forEach is not a function`

---

## Key conventions

- **No optional chaining** (`?.`) — breaks on some mobile browsers. Use `&&` instead.
- **No arrow functions in event listeners** inside loops — use `function()` to avoid closure bugs.
- **Variable naming:** avoid reusing short names like `m` across different scopes.
- **CSS variables** for all colors — defined in `:root` and theme/dark-mode classes.
- **Themes:** `.theme-slate`, `.theme-rose`, `.theme-violet`, `.theme-teal`, `.theme-amber`
- **Dark mode:** `body.dark` / `body.light` override system preference; `body` default is `prefers-color-scheme`.
- **Date keys:** always `YYYY-MM-DD` format via `mkKey()`.
- **Inline styles:** computed/dynamic values use inline style strings; static values use CSS classes.
- **Pronouns:** `state.pronombre` is `'ella'|'él'|'elle'` — greetings and labels adapt accordingly.
- **Language:** UI is in **Spanish**. Code comments are in Spanish. This is intentional.

---

## Design system

- Font: Inter (Google Fonts)
- Base background: `#faf9f7` (warm off-white)
- Cards: `border-radius: 18px`, subtle `box-shadow`
- Touch targets: minimum 44px height
- Accent color: user-chosen, default violet `#7c5cfc`
- Layout: mobile-first bottom nav; desktop sidebar kicks in at 860px+

---

## Key UI features

- **Splash screen:** 3.5s fade-out on first load
- **Toast notifications:** 3-second auto-dismiss, top-right
- **Bienestar tracker:** water glasses (0–8), sleep hours (5–10), mood (1–5 emoji scale)
- **Contadores:** countdown timers to named events with emoji + color
- **Word of day:** rotates daily from 35 vocabulary entries (A1/A2/B1) in ES/EN/DE
- **Google Calendar sync:** `syncGoogleCalendar()` fetches iCal URL and parses events (work in progress)
- **Vibration:** `navigator.vibrate(30)` on habit check-off
- **Projects:** status badges — `En proceso` / `No iniciado` / `Pausado` / `Completado`
- **Menu:** 4-week rotation with almuerzo + cena, custom override per day, auto-generate shopping list

---

## Supabase

- URL: `https://fermqeydxidjvyspvxid.supabase.co`
- Table: `app_data` — columns: `user_id (text PK)`, `data (jsonb)`, `updated_at (timestamptz)`
- Public key type: `sb_publishable_...`
- RLS: public access policy — user identified by `{email or nombre}_tutuca` key, no auth

---

## Service Worker

- File: `sw.js`
- Cache name pattern: `tutuca-v{YYYY-MM-DD}-{NNN}` (e.g. `tutuca-v2026-05-25-004`)
- Strategy: network-first with cache fallback; auto-activates new version on detection

> ⚠️ After every significant change to `index.html`, update the cache version in `sw.js`:
> `const CACHE = 'tutuca-v{date}-{version}';`

---

## Planned improvements

- [ ] Split into multiple `.js` modules (currently one giant file)
- [ ] Migrate to Vite + TypeScript
- [ ] Multi-language support (ES / EN / DE) — `idiomaUsar` state field exists, partial implementation
- [ ] Complete Google Calendar sync via iCal URL (function exists but incomplete)
- [ ] Proper PWA icon per user (canvas-generated from emoji)

---

## When making changes

1. Edit `index.html` directly
2. Test in browser (open file locally or push to GitHub Pages)
3. To update the live app: push `index.html` to the `main` branch (GitHub Pages auto-deploys)
4. Update cache version in `sw.js` after significant changes
5. The Service Worker handles auto-updates for installed PWA users
