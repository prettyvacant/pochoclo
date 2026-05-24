# CLAUDE.md — Tutuca

This file helps Claude Code and Claude understand this project.

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

The entire app lives in **one file: `index.html`** (~130KB).  
There is no `package.json`, no bundler, no transpiler.

---

## File structure

```
tutuca/
├── index.html      ← The entire app (HTML + CSS + JS)
├── sw.js           ← Service Worker for offline + auto-updates
├── manifest.json   ← PWA manifest
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
  tab, grupos, checks, semana, meals, eventos,
  movs, gastosFijos, compras, bienestar, notas,
  contadores, proyectos, tareas, customMenu,
  icalUrl, theme, perfil, sueldoBase, vidaVista, ...
}
```

### Rendering
The app uses a manual DOM rendering approach — no virtual DOM.  
Every state change calls `save()` then `render()` which rebuilds the active tab.

```js
function render() {
  renderTabs();
  renderContent();
}
```

### Storage
- `LS.get(key)` / `LS.set(key, value)` — localStorage wrapper
- `sbSave(userId, data)` / `sbLoad(userId)` — Supabase sync
- `scheduleSbSave()` — debounced cloud save (2s after last change)

### DOM helpers
```js
const el = (tag, props, children) => { ... }  // createElement helper
const div = (cls, children, style) => { ... }  // shorthand for divs
const btn = (text, cls, onclick, style) => { ... }
const $ = id => document.getElementById(id)
```

**Important:** `children` must always be an **array**, never a string.  
`el('div', {}, ['text'])` ✓  
`el('div', {}, 'text')` ✗ — will throw `children.forEach is not a function`

---

## Tab structure

| Tab ID | Label | Content |
|---|---|---|
| `diario` | 📋 Diario | Date + clock, today's tasks, wellbeing tracker |
| `rutinas` | 🏃 Rutinas | Habit tracker (salud, movimiento, mente, escritura) |
| `casa` | 🏠 Casa | Home chores (limpiar, ordenar, lavarropas...) |
| `trabajo` | 💼 Trabajo | Work routines + projects |
| `vida` | 🌿 Vida | Sub-tabs: Menú / Finanzas / Compras |
| `personal` | 💭 Personal | Notes |

---

## Key conventions

- **No optional chaining** (`?.`) — breaks in some mobile browsers. Use `&&` instead.
- **No arrow functions in event listeners** added to dynamically created elements inside loops — use `function()` to avoid closure bugs.
- **Variable naming:** avoid reusing variable names like `m` (used for both month index and prompt result in different scopes).
- **CSS variables** for all colors — defined in `:root` and theme classes.
- **Themes:** `.theme-slate`, `.theme-rose`, `.theme-violet`, `.theme-teal`, `.theme-amber`

---

## Supabase

- Project ID: `fermqeydxidjvyspvxid`
- Table: `app_data` with columns `user_id (text PK)`, `data (jsonb)`, `updated_at (timestamptz)`
- RLS: public access policy (user identified by email+name key, not auth)
- Key type: publishable (`sb_publishable_...`)

---

## Planned improvements

- [ ] Split into multiple `.js` modules (currently one giant file)
- [ ] Migrate to Vite + TypeScript
- [ ] Multi-language support (ES / EN / DE)
- [ ] Word of the day feature (language learning)
- [ ] Google Calendar sync via iCal URL
- [ ] Proper PWA icon per user (canvas-generated from emoji)

---

## Design system

- Font: Inter (Google Fonts)
- Base background: `#faf9f7` (warm off-white)
- Cards: `border-radius: 18px`, subtle shadow
- Touch targets: minimum 44px height
- Accent color: user-chosen, default violet `#7c5cfc`

---

## Language

The app UI is in **Spanish**. Comments in the code are also in Spanish.  
This is intentional — *100% espíritu varelense*.

---

## When making changes

1. Edit `index.html` directly
2. Test in browser (open file locally or push to GitHub Pages)
3. To update the live app: replace `index.html` in the GitHub repo
4. The Service Worker handles auto-updates for installed PWA users

> ⚠️ After every significant change, update the cache version string in `sw.js`:
> `const CACHE = 'tutuca-v{date}-{version}';`
