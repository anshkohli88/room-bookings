# Room Booking App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA for 3 managers to track bookings across 6 rooms in Chandigarh, using Google Calendar as the database.

**Architecture:** Plain HTML/CSS/JS PWA hosted on GitHub Pages. Google Identity Services (GIS) handles OAuth 2.0 token acquisition; all booking data lives in one shared Google Calendar accessed via the REST API. A hash-based router swaps screens in a single `<div id="app">` container.

**Tech Stack:** Plain ES module JavaScript, Google Identity Services CDN, Google Calendar REST API v3, CSS custom properties, Jest (unit tests for pure logic only), GitHub Pages.

---

## Pre-requisites (one-time manual setup — do BEFORE coding)

These steps must be completed by the property owner before the app can work:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → New Project → name it "Room Bookings"
2. Enable **Google Calendar API**: APIs & Services → Library → search "Google Calendar API" → Enable
3. Create OAuth credentials: APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application
   - Name: "Room Bookings App"
   - Authorized JavaScript origins: `https://<your-github-username>.github.io` (add `http://localhost:8080` for local dev)
   - Authorized redirect URIs: same URLs
   - Copy the **Client ID** — it looks like `xxxx.apps.googleusercontent.com`
4. Configure OAuth consent screen: APIs & Services → OAuth consent screen → External → fill app name, support email, add scope `https://www.googleapis.com/auth/calendar`
5. In Google Calendar: create a new calendar named "Room Bookings Chandigarh" → share it (with edit rights) with all 3 managers' Gmail addresses → get the Calendar ID from Settings → it looks like `xxxx@group.calendar.google.com`
6. Put the Client ID and Calendar ID into `config.js` (Task 2)

---

## File Structure

```
/
├── index.html                  # App shell — single HTML file, mounts all screens
├── manifest.json               # PWA manifest (name, icons, theme)
├── sw.js                       # Service worker — caches app shell
├── config.js                   # CLIENT_ID, CALENDAR_ID, ALLOWED_EMAILS (edit this)
├── css/
│   └── styles.css              # All CSS: variables, reset, layout, components
├── js/
│   ├── model.js                # Room definitions, booking parse/format, date utils
│   ├── auth.js                 # Google OAuth token flow, whitelist check, session
│   ├── api.js                  # Google Calendar REST API wrapper (CRUD)
│   ├── ui.js                   # Toast, confirm dialog, loading spinner, shared helpers
│   ├── app.js                  # Entry point: router, auth guard, screen mounting
│   └── screens/
│       ├── login.js            # Login screen HTML + handlers
│       ├── home.js             # Home screen: room grid, stats bar
│       ├── room.js             # Room detail: booking list for one room
│       └── booking.js          # Add/Edit form + inline date range picker
├── icons/
│   ├── icon-192.png            # PWA icon (generated in Task 13)
│   └── icon-512.png
├── package.json                # Jest only — no build tool
├── tests/
│   ├── model.test.js           # Unit tests: parse/format booking, date utils
│   └── auth.test.js            # Unit tests: whitelist check logic
└── .github/
    └── workflows/
        └── deploy.yml          # GitHub Pages deploy on push to main
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `package.json`
- Create: `css/styles.css` (empty placeholder)
- Create: `js/app.js` (empty placeholder)

- [ ] **Step 1: Create the directory structure**

```bash
cd "/Users/waffle/Calender App"
mkdir -p css js/screens icons tests .github/workflows
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "room-bookings",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest",
    "serve": "npx http-server -p 8080 -c-1"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {}
  }
}
```

- [ ] **Step 3: Install dev dependencies**

```bash
cd "/Users/waffle/Calender App" && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="theme-color" content="#0F172A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Room Bookings</title>
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <link rel="stylesheet" href="css/styles.css">
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Google Identity Services -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div id="app">
    <!-- Screens are rendered here by JS -->
    <div id="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create empty placeholder files so imports don't break**

```bash
touch "/Users/waffle/Calender App/css/styles.css"
touch "/Users/waffle/Calender App/js/model.js"
touch "/Users/waffle/Calender App/js/auth.js"
touch "/Users/waffle/Calender App/js/api.js"
touch "/Users/waffle/Calender App/js/ui.js"
touch "/Users/waffle/Calender App/js/app.js"
touch "/Users/waffle/Calender App/js/screens/login.js"
touch "/Users/waffle/Calender App/js/screens/home.js"
touch "/Users/waffle/Calender App/js/screens/room.js"
touch "/Users/waffle/Calender App/js/screens/booking.js"
```

- [ ] **Step 6: Commit scaffold**

```bash
cd "/Users/waffle/Calender App"
git add index.html package.json package-lock.json css/ js/ icons/ tests/ .github/
git commit -m "feat: project scaffold — HTML shell, directory structure, package.json"
```

---

## Task 2: Config & Manifest

**Files:**
- Create: `config.js`
- Create: `manifest.json`

- [ ] **Step 1: Create `config.js`**

Replace the placeholder values with real ones from the Google Cloud Console pre-requisite steps.

```javascript
// config.js
// ⚠️  Fill in YOUR values before running the app
const CONFIG = {
  // From Google Cloud Console → APIs & Services → Credentials
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',

  // From Google Calendar → Settings → your shared calendar → Calendar ID
  CALENDAR_ID: 'YOUR_CALENDAR_ID@group.calendar.google.com',

  // Gmail addresses of the 3 managers — only these can log in
  ALLOWED_EMAILS: [
    'manager1@gmail.com',
    'manager2@gmail.com',
    'manager3@gmail.com',
  ],

  // How far ahead to fetch bookings (in days)
  FETCH_DAYS_AHEAD: 180,
};

export default CONFIG;
```

- [ ] **Step 2: Create `manifest.json`**

```json
{
  "name": "Room Bookings — Chandigarh",
  "short_name": "Room Bookings",
  "description": "Track room bookings for 6 rooms in Chandigarh",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/waffle/Calender App"
git add config.js manifest.json
git commit -m "feat: add config.js (client ID, calendar ID, whitelist) and PWA manifest"
```

---

## Task 3: CSS Design System

**Files:**
- Write: `css/styles.css`

- [ ] **Step 1: Write `css/styles.css`**

```css
/* ============================================================
   CSS DESIGN SYSTEM — Room Bookings App
   Midnight Slate colour scheme
   ============================================================ */

:root {
  /* Colours */
  --col-header-start:  #0F172A;
  --col-header-end:    #1E293B;
  --col-primary:       #3B82F6;
  --col-primary-hover: #2563EB;
  --col-primary-light: #EFF6FF;
  --col-free:          #10B981;
  --col-free-light:    #ECFDF5;
  --col-occupied:      #EF4444;
  --col-occupied-light:#FEF2F2;
  --col-bg:            #F8FAFC;
  --col-card:          #FFFFFF;
  --col-border:        #E2E8F0;
  --col-text:          #0F172A;
  --col-text-soft:     #64748B;
  --col-white:         #FFFFFF;
  --col-danger:        #EF4444;
  --col-danger-light:  #FEE2E2;

  /* Typography */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;

  /* Sizes */
  --radius-card:  14px;
  --radius-input: 12px;
  --radius-badge: 20px;
  --radius-btn:   12px;
  --min-tap:      48px;
  --font-min:     18px;
}

/* ---- Reset ---- */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; -webkit-text-size-adjust: 100%; }
body {
  font-family: var(--font-body);
  background: var(--col-bg);
  color: var(--col-text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
button { font-family: var(--font-body); cursor: pointer; border: none; background: none; }
input, textarea, select { font-family: var(--font-body); }
a { text-decoration: none; color: inherit; }

/* ---- App Shell ---- */
#app { max-width: 480px; margin: 0 auto; min-height: 100vh; position: relative; }

/* ---- Loading overlay ---- */
.loading-overlay {
  position: fixed; inset: 0;
  background: var(--col-header-start);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  transition: opacity 0.3s;
}
.loading-overlay.hidden { opacity: 0; pointer-events: none; }

.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: var(--col-white);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ---- Header ---- */
.app-header {
  background: linear-gradient(135deg, var(--col-header-start), var(--col-header-end));
  padding: 16px 20px 20px;
  position: sticky; top: 0; z-index: 10;
}
.app-header-row {
  display: flex; align-items: center; justify-content: space-between;
}
.app-header-title {
  font-family: var(--font-display);
  font-size: 22px; font-weight: 700;
  color: var(--col-white);
}
.app-header-sub {
  font-size: 13px; color: rgba(255,255,255,0.6);
  margin-top: 2px;
}
.app-header-back {
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: white;
  min-width: var(--min-tap); min-height: var(--min-tap);
}
.app-header-avatar {
  width: 38px; height: 38px;
  background: var(--col-primary);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: white; font-weight: 700;
  border: 2px solid rgba(255,255,255,0.3);
}
.header-room-chip {
  display: inline-block;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-badge);
  padding: 3px 12px; font-size: 13px;
  color: white; font-weight: 600; margin-top: 6px;
}

/* ---- Stats bar ---- */
.stats-bar {
  display: flex;
  background: var(--col-header-end);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.stat-item {
  flex: 1; padding: 10px 0; text-align: center;
  border-right: 1px solid rgba(255,255,255,0.1);
}
.stat-item:last-child { border-right: none; }
.stat-num { font-size: 22px; font-weight: 700; line-height: 1; }
.stat-num.green { color: #34D399; }
.stat-num.red   { color: #F87171; }
.stat-num.blue  { color: #93C5FD; }
.stat-label { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; font-weight: 600; }

/* ---- Screen body ---- */
.screen-body { padding: 14px 14px 80px; }

/* ---- Floor label ---- */
.floor-label {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--col-text-soft);
  margin: 14px 0 8px;
}

/* ---- Room grid ---- */
.room-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 6px; }

/* ---- Room card ---- */
.room-card {
  background: var(--col-card);
  border-radius: var(--radius-card);
  padding: 14px 12px 12px;
  border: 2px solid var(--col-border);
  position: relative; overflow: hidden;
  min-height: var(--min-tap);
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.room-card:active { transform: scale(0.97); }
.room-card.free    { border-color: var(--col-free); }
.room-card.occupied { border-color: var(--col-occupied); }
.room-card-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: var(--col-free);
}
.room-card.occupied .room-card-bar { background: var(--col-occupied); }
.room-name {
  font-family: var(--font-display);
  font-size: 24px; font-weight: 900;
  color: var(--col-text); line-height: 1;
  margin-bottom: 6px;
}
.status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  padding: 3px 9px; border-radius: var(--radius-badge);
}
.status-badge.free     { background: var(--col-free-light);     color: var(--col-free); }
.status-badge.occupied { background: var(--col-occupied-light); color: var(--col-occupied); }
.room-guest-info { font-size: 12px; color: var(--col-text-soft); margin-top: 6px; font-weight: 500; line-height: 1.4; }

/* ---- Primary button ---- */
.btn-primary {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 16px;
  background: var(--col-primary); color: white;
  border-radius: var(--radius-btn); font-size: var(--font-min);
  font-weight: 700; min-height: var(--min-tap);
  box-shadow: 0 4px 14px rgba(59,130,246,0.35);
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:active { background: var(--col-primary-hover); transform: scale(0.98); }
.btn-icon {
  width: 28px; height: 28px; background: rgba(255,255,255,0.25);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 20px; line-height: 1;
}

/* ---- Danger button ---- */
.btn-danger {
  width: 100%; padding: 14px;
  background: var(--col-danger-light); color: var(--col-danger);
  border-radius: var(--radius-btn); font-size: 16px;
  font-weight: 700; min-height: var(--min-tap);
  border: 2px solid var(--col-danger);
  margin-top: 10px;
}
.btn-danger:active { background: var(--col-danger); color: white; }

/* ---- Add button footer (fixed at bottom) ---- */
.btn-footer {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px;
  padding: 12px 14px;
  background: var(--col-bg);
  border-top: 1px solid var(--col-border);
}

/* ---- Booking list item ---- */
.booking-item {
  background: var(--col-card);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  margin-bottom: 10px;
  border: 1px solid var(--col-border);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer;
  min-height: var(--min-tap);
}
.booking-item:active { background: #F1F5F9; }
.booking-guest { font-size: var(--font-min); font-weight: 700; color: var(--col-text); }
.booking-dates { font-size: 14px; color: var(--col-text-soft); margin-top: 4px; }
.booking-meta  {
  display: flex; align-items: center; gap: 8px;
  margin-top: 8px; flex-wrap: wrap;
}
.booking-rent  { font-size: 15px; font-weight: 700; color: var(--col-text); }
.payment-chip  {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: var(--radius-badge); text-transform: uppercase;
}
.payment-chip.paid    { background: var(--col-free-light);     color: var(--col-free); }
.payment-chip.pending { background: #FEF3C7;                   color: #D97706; }
.empty-state {
  text-align: center; padding: 48px 20px;
  color: var(--col-text-soft); font-size: var(--font-min);
}

/* ---- Form fields ---- */
.field-group { margin-bottom: 16px; }
.field-label {
  display: block; font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--col-text-soft); margin-bottom: 6px;
}
.field-input {
  width: 100%; padding: 14px 16px;
  background: var(--col-card); color: var(--col-text);
  border: 2px solid var(--col-border); border-radius: var(--radius-input);
  font-size: var(--font-min); min-height: var(--min-tap);
  transition: border-color 0.15s;
}
.field-input:focus { outline: none; border-color: var(--col-primary); }
.field-input::placeholder { color: #CBD5E1; }
select.field-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='2' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }
textarea.field-input { resize: vertical; min-height: 80px; }

/* ---- Payment toggle ---- */
.payment-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.payment-opt {
  padding: 14px; text-align: center;
  border: 2px solid var(--col-border); border-radius: var(--radius-input);
  cursor: pointer; min-height: var(--min-tap);
  transition: all 0.15s;
}
.payment-opt-icon { font-size: 22px; }
.payment-opt-label { font-size: 14px; font-weight: 700; margin-top: 4px; color: var(--col-text-soft); }
.payment-opt.selected-paid    { border-color: var(--col-free);     background: var(--col-free-light); }
.payment-opt.selected-paid .payment-opt-label    { color: var(--col-free); }
.payment-opt.selected-pending { border-color: #F59E0B; background: #FEF3C7; }
.payment-opt.selected-pending .payment-opt-label { color: #D97706; }

/* ---- Date picker ---- */
.date-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.date-chip {
  padding: 12px 14px; border-radius: var(--radius-input);
  border: 2px solid var(--col-border); background: var(--col-card);
}
.date-chip.active { border-color: var(--col-primary); background: var(--col-primary-light); }
.date-chip-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--col-text-soft); }
.date-chip-value { font-size: 15px; font-weight: 700; color: var(--col-text); margin-top: 2px; }
.date-chip-value.placeholder { color: #CBD5E1; font-weight: 400; }

.mini-cal {
  background: var(--col-card);
  border: 2px solid var(--col-primary);
  border-radius: var(--radius-card); overflow: hidden;
  margin-bottom: 16px;
}
.cal-header {
  background: linear-gradient(135deg, var(--col-header-start), var(--col-header-end));
  color: white; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 700; font-size: 16px;
}
.cal-nav {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; cursor: pointer; min-height: var(--min-tap);
}
.cal-grid { padding: 12px; }
.cal-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center; font-size: 11px; font-weight: 700;
  color: var(--col-text-soft); text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 8px;
}
.cal-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.cal-day {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 500; border-radius: 50%; cursor: pointer;
  min-height: 36px; transition: background 0.1s;
}
.cal-day:empty { cursor: default; }
.cal-day.other-month { color: #CBD5E1; cursor: default; }
.cal-day.today        { background: var(--col-primary); color: white; font-weight: 700; }
.cal-day.check-in     { background: #1D4ED8; color: white; font-weight: 700; border-radius: 50% 0 0 50%; }
.cal-day.check-out    { background: #1D4ED8; color: white; font-weight: 700; border-radius: 0 50% 50% 0; }
.cal-day.in-range     { background: var(--col-primary-light); color: #1D4ED8; font-weight: 600; border-radius: 0; }
.cal-day.check-in.check-out { border-radius: 50%; }
.cal-day.booked       { background: var(--col-occupied-light); color: var(--col-occupied); cursor: not-allowed; font-size: 12px; text-decoration: line-through; }
.cal-day.past         { color: #CBD5E1; cursor: not-allowed; }
.cal-day:not(.booked):not(.past):not(.today):not(.other-month):not(:empty):hover { background: #E2E8F0; }

.cal-instruction { text-align: center; font-size: 14px; color: var(--col-text-soft); margin-bottom: 8px; font-weight: 500; }

/* ---- Toast ---- */
.toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  padding: 14px 24px; border-radius: var(--radius-card);
  font-size: 16px; font-weight: 600; color: white;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 900;
  animation: toastIn 0.25s ease, toastOut 0.25s ease 2.5s forwards;
  white-space: nowrap;
}
.toast.success { background: var(--col-free); }
.toast.error   { background: var(--col-danger); }
@keyframes toastIn  { from { opacity:0; transform: translateX(-50%) translateY(20px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
@keyframes toastOut { from { opacity:1; } to { opacity:0; } }

/* ---- Confirm dialog ---- */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 800; padding: 20px;
}
.dialog {
  background: var(--col-card); border-radius: var(--radius-card);
  padding: 28px 24px; width: 100%; max-width: 340px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.dialog-title  { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
.dialog-body   { font-size: var(--font-min); color: var(--col-text-soft); margin-bottom: 24px; }
.dialog-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dialog-btn {
  padding: 14px; border-radius: var(--radius-btn);
  font-size: 16px; font-weight: 700; min-height: var(--min-tap);
}
.dialog-btn.cancel  { background: var(--col-bg); color: var(--col-text-soft); border: 2px solid var(--col-border); }
.dialog-btn.confirm { background: var(--col-danger); color: white; }

/* ---- Success flash ---- */
.success-flash {
  position: fixed; inset: 0; background: var(--col-free);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 950; color: white;
  animation: flashOut 0.4s ease 1.8s forwards;
}
.success-flash-icon  { font-size: 72px; margin-bottom: 16px; }
.success-flash-text  { font-family: var(--font-display); font-size: 28px; font-weight: 700; }
@keyframes flashOut { to { opacity: 0; pointer-events: none; } }

/* ---- Login screen ---- */
.login-screen {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: linear-gradient(160deg, var(--col-header-start) 0%, #1E3A5F 100%);
  padding: 40px 32px; text-align: center;
}
.login-logo   { font-size: 64px; margin-bottom: 20px; }
.login-title  { font-family: var(--font-display); font-size: 32px; font-weight: 900; color: white; margin-bottom: 8px; }
.login-sub    { font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 48px; }
.login-btn {
  display: flex; align-items: center; gap: 12px;
  background: white; color: var(--col-text);
  padding: 16px 28px; border-radius: var(--radius-card);
  font-size: var(--font-min); font-weight: 700;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  min-height: var(--min-tap);
  transition: transform 0.1s;
}
.login-btn:active { transform: scale(0.97); }
.login-btn img { width: 24px; height: 24px; }
.login-error { color: #FCA5A5; font-size: 15px; margin-top: 20px; font-weight: 500; }
```

- [ ] **Step 2: Verify styles file was written**

```bash
wc -l "/Users/waffle/Calender App/css/styles.css"
```

Expected: 300+ lines.

- [ ] **Step 3: Commit**

```bash
cd "/Users/waffle/Calender App"
git add css/styles.css
git commit -m "feat: complete CSS design system — Midnight Slate theme, all components"
```

---

## Task 4: Booking Model (Pure Logic)

**Files:**
- Write: `js/model.js`
- Write: `tests/model.test.js`

This is pure data logic with no DOM or API dependencies — fully unit-testable.

- [ ] **Step 1: Write the failing tests first**

```javascript
// tests/model.test.js
import { parseDescription, formatDescription, isOccupiedToday, ROOMS } from '../js/model.js';

describe('ROOMS', () => {
  test('has 6 rooms', () => {
    expect(ROOMS).toHaveLength(6);
  });
  test('room IDs are correct', () => {
    const ids = ROOMS.map(r => r.id);
    expect(ids).toEqual(['GF-1','GF-2','GF-3','GF-4','FF-1','FF-2']);
  });
});

describe('parseDescription', () => {
  const desc = `ROOM: GF-1\nGUEST: Raj Sharma\nPHONE: +91 98765 43210\nGUESTS: 2\nRENT: 12000\nPAYMENT: PAID\nNOTES: Late checkout`;

  test('parses room', ()    => expect(parseDescription(desc).room).toBe('GF-1'));
  test('parses phone', ()   => expect(parseDescription(desc).phone).toBe('+91 98765 43210'));
  test('parses guests', ()  => expect(parseDescription(desc).guestCount).toBe(2));
  test('parses rent', ()    => expect(parseDescription(desc).rent).toBe(12000));
  test('parses payment', () => expect(parseDescription(desc).payment).toBe('PAID'));
  test('parses notes', ()   => expect(parseDescription(desc).notes).toBe('Late checkout'));
  test('handles empty notes', () => {
    expect(parseDescription('ROOM: FF-1\nGUEST: A\nPHONE: \nGUESTS: 1\nRENT: 0\nPAYMENT: PENDING\nNOTES: ').notes).toBe('');
  });
  test('handles missing keys gracefully', () => {
    const result = parseDescription('ROOM: GF-2');
    expect(result.phone).toBe('');
    expect(result.guestCount).toBe(1);
    expect(result.payment).toBe('PENDING');
  });
});

describe('formatDescription', () => {
  test('round-trips through parse', () => {
    const booking = { room:'GF-1', phone:'+91 111', guestCount:3, rent:5000, payment:'PENDING', notes:'test' };
    const parsed = parseDescription(formatDescription(booking));
    expect(parsed.room).toBe('GF-1');
    expect(parsed.guestCount).toBe(3);
    expect(parsed.payment).toBe('PENDING');
  });
});

describe('isOccupiedToday', () => {
  const today = new Date('2026-04-08');
  test('event spanning today returns true', () => {
    expect(isOccupiedToday({ start:'2026-04-05', end:'2026-04-12' }, today)).toBe(true);
  });
  test('event ending today returns false (checkout day = free)', () => {
    expect(isOccupiedToday({ start:'2026-04-05', end:'2026-04-08' }, today)).toBe(false);
  });
  test('future event returns false', () => {
    expect(isOccupiedToday({ start:'2026-04-10', end:'2026-04-15' }, today)).toBe(false);
  });
  test('past event returns false', () => {
    expect(isOccupiedToday({ start:'2026-04-01', end:'2026-04-05' }, today)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect ALL to fail**

```bash
cd "/Users/waffle/Calender App" && npm test
```

Expected: FAIL — "Cannot find module '../js/model.js' or module has no exports"

- [ ] **Step 3: Write `js/model.js`**

```javascript
// js/model.js

/** All 6 rooms with their floor grouping and Google Calendar event colour. */
export const ROOMS = [
  { id: 'GF-1', floor: 'Ground Floor', calColor: '11' }, // Tomato
  { id: 'GF-2', floor: 'Ground Floor', calColor: '4'  }, // Flamingo
  { id: 'GF-3', floor: 'Ground Floor', calColor: '6'  }, // Tangerine
  { id: 'GF-4', floor: 'Ground Floor', calColor: '5'  }, // Banana
  { id: 'FF-1', floor: 'First Floor',  calColor: '2'  }, // Sage
  { id: 'FF-2', floor: 'First Floor',  calColor: '9'  }, // Peacock
];

/** Returns room object by ID, or undefined. */
export function getRoomById(id) {
  return ROOMS.find(r => r.id === id);
}

/**
 * Parses the structured description block from a Google Calendar event.
 * @param {string} description
 * @returns {{ room, phone, guestCount, rent, payment, notes }}
 */
export function parseDescription(description) {
  const map = {};
  (description || '').split('\n').forEach(line => {
    const idx = line.indexOf(': ');
    if (idx === -1) return;
    map[line.slice(0, idx).trim()] = line.slice(idx + 2).trim();
  });
  return {
    room:       map['ROOM']    || '',
    phone:      map['PHONE']   || '',
    guestCount: parseInt(map['GUESTS']) || 1,
    rent:       parseInt(map['RENT'])   || 0,
    payment:    map['PAYMENT'] || 'PENDING',
    notes:      map['NOTES']   || '',
  };
}

/**
 * Formats a booking object into the structured description block.
 * @param {{ room, phone, guestCount, rent, payment, notes }} booking
 * @returns {string}
 */
export function formatDescription(booking) {
  return [
    `ROOM: ${booking.room}`,
    `PHONE: ${booking.phone || ''}`,
    `GUESTS: ${booking.guestCount || 1}`,
    `RENT: ${booking.rent || 0}`,
    `PAYMENT: ${booking.payment || 'PENDING'}`,
    `NOTES: ${booking.notes || ''}`,
  ].join('\n');
}

/**
 * Checks if a booking event covers today.
 * Check-out day is treated as free (guest has left).
 * @param {{ start: string, end: string }} event  ISO date strings (YYYY-MM-DD)
 * @param {Date} [today]  Optional — defaults to new Date()
 * @returns {boolean}
 */
export function isOccupiedToday(event, today = new Date()) {
  const todayStr = toDateStr(today);
  return event.start <= todayStr && event.end > todayStr;
}

/**
 * Converts a Date to a YYYY-MM-DD string in local time.
 * @param {Date} date
 * @returns {string}
 */
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a YYYY-MM-DD date string for human display (e.g. "12 Apr 2026").
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}
```

- [ ] **Step 4: Run tests — expect ALL to pass**

```bash
cd "/Users/waffle/Calender App" && npm test
```

Expected: PASS — all tests in `tests/model.test.js` green.

- [ ] **Step 5: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/model.js tests/model.test.js
git commit -m "feat: booking model — room definitions, parse/format description, date utils (TDD)"
```

---

## Task 5: Auth Module

**Files:**
- Write: `js/auth.js`
- Write: `tests/auth.test.js`

- [ ] **Step 1: Write failing tests for the whitelist check**

```javascript
// tests/auth.test.js
import { isEmailAllowed } from '../js/auth.js';

const ALLOWED = ['a@gmail.com', 'b@gmail.com', 'c@gmail.com'];

describe('isEmailAllowed', () => {
  test('allowed email returns true',     () => expect(isEmailAllowed('a@gmail.com', ALLOWED)).toBe(true));
  test('unknown email returns false',    () => expect(isEmailAllowed('hacker@evil.com', ALLOWED)).toBe(false));
  test('empty email returns false',      () => expect(isEmailAllowed('', ALLOWED)).toBe(false));
  test('case-insensitive match',         () => expect(isEmailAllowed('A@GMAIL.COM', ALLOWED)).toBe(true));
});
```

- [ ] **Step 2: Run tests — expect fail**

```bash
cd "/Users/waffle/Calender App" && npm test
```

Expected: FAIL — "Cannot find module '../js/auth.js'"

- [ ] **Step 3: Write `js/auth.js`**

```javascript
// js/auth.js
import CONFIG from '../config.js';

let _tokenClient = null;
let _accessToken = sessionStorage.getItem('gToken') || null;
let _tokenExpiry  = parseInt(sessionStorage.getItem('gTokenExpiry') || '0');
let _currentUser  = JSON.parse(sessionStorage.getItem('gUser') || 'null');

/** Checks if an email is in the allowed list (case-insensitive). */
export function isEmailAllowed(email, allowedList) {
  return allowedList.map(e => e.toLowerCase()).includes((email || '').toLowerCase());
}

/** Returns true if we have a valid, non-expired access token. */
export function isAuthenticated() {
  return !!_accessToken && Date.now() < _tokenExpiry;
}

/** Returns the cached user object { name, email } or null. */
export function getCurrentUser() {
  return _currentUser;
}

/** Returns the access token string for API calls. */
export function getAccessToken() {
  return _accessToken;
}

/**
 * Initialises the Google Identity Services token client.
 * Must be called after the GSI script has loaded.
 * @param {function} onSuccess  Called with user object on successful auth.
 * @param {function} onError    Called with error message string.
 */
export function initAuth(onSuccess, onError) {
  if (typeof google === 'undefined') {
    onError('Google Sign-In failed to load. Please refresh the page.');
    return;
  }

  _tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar',
    callback: (resp) => _handleTokenResponse(resp, onSuccess, onError),
  });
}

/** Triggers the Google Sign-In popup / one-tap flow. */
export function signIn() {
  if (!_tokenClient) throw new Error('Auth not initialised — call initAuth first.');
  _tokenClient.requestAccessToken({ prompt: '' });
}

/** Clears the session and signs the user out. */
export function signOut() {
  if (_accessToken) {
    google.accounts.oauth2.revoke(_accessToken);
  }
  _accessToken = null;
  _tokenExpiry = 0;
  _currentUser = null;
  sessionStorage.removeItem('gToken');
  sessionStorage.removeItem('gTokenExpiry');
  sessionStorage.removeItem('gUser');
}

// ---- Private ----

async function _handleTokenResponse(resp, onSuccess, onError) {
  if (resp.error) {
    onError('Sign-in was cancelled or failed. Please try again.');
    return;
  }

  _accessToken = resp.access_token;
  _tokenExpiry = Date.now() + (resp.expires_in * 1000);
  sessionStorage.setItem('gToken', _accessToken);
  sessionStorage.setItem('gTokenExpiry', String(_tokenExpiry));

  try {
    const userResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${_accessToken}` },
    });
    const user = await userResp.json();

    if (!isEmailAllowed(user.email, CONFIG.ALLOWED_EMAILS)) {
      signOut();
      onError('Access not authorised. Please contact the property manager.');
      return;
    }

    _currentUser = { name: user.name, email: user.email };
    sessionStorage.setItem('gUser', JSON.stringify(_currentUser));
    onSuccess(_currentUser);
  } catch {
    signOut();
    onError('Could not verify your account. Please check your internet connection.');
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd "/Users/waffle/Calender App" && npm test
```

Expected: PASS — all tests green including auth whitelist tests.

- [ ] **Step 5: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/auth.js tests/auth.test.js
git commit -m "feat: auth module — Google OAuth token client, whitelist check, session management (TDD)"
```

---

## Task 6: Google Calendar API Wrapper

**Files:**
- Write: `js/api.js`

No unit tests here — this module makes network calls. It will be tested manually in Task 10.

- [ ] **Step 1: Write `js/api.js`**

```javascript
// js/api.js
import CONFIG from '../config.js';
import { getAccessToken } from './auth.js';
import { formatDescription, getRoomById } from './model.js';

const BASE = 'https://www.googleapis.com/calendar/v3';
const CAL  = encodeURIComponent(CONFIG.CALENDAR_ID);

/** Shared fetch wrapper — attaches auth header, throws on HTTP error. */
async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${resp.status}`);
  }

  return resp.status === 204 ? null : resp.json();
}

/**
 * Fetches all booking events from the shared calendar within a date window.
 * Returns raw Google Calendar event objects.
 */
export async function fetchAllEvents() {
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 30); // include current bookings that started in past

  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + CONFIG.FETCH_DAYS_AHEAD);

  const params = new URLSearchParams({
    timeMin:      timeMin.toISOString(),
    timeMax:      timeMax.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '500',
  });

  const data = await apiFetch(`/calendars/${CAL}/events?${params}`);
  return data.items || [];
}

/**
 * Creates a new booking event in Google Calendar.
 * @param {{ room, guest, phone, guestCount, rent, payment, notes, checkIn, checkOut }} booking
 *   checkIn / checkOut are YYYY-MM-DD strings.
 * @returns {object} Created event object.
 */
export async function createEvent(booking) {
  const room = getRoomById(booking.room);
  const body = {
    summary:          `${booking.room} · ${booking.guest}`,
    description:      formatDescription(booking),
    colorId:          room?.calColor || '1',
    start:            { date: booking.checkIn  },
    end:              { date: booking.checkOut },
  };
  return apiFetch(`/calendars/${CAL}/events`, { method: 'POST', body: JSON.stringify(body) });
}

/**
 * Updates an existing booking event.
 * @param {string} eventId  Google Calendar event ID.
 * @param {{ room, guest, phone, guestCount, rent, payment, notes, checkIn, checkOut }} booking
 * @returns {object} Updated event object.
 */
export async function updateEvent(eventId, booking) {
  const room = getRoomById(booking.room);
  const body = {
    summary:          `${booking.room} · ${booking.guest}`,
    description:      formatDescription(booking),
    colorId:          room?.calColor || '1',
    start:            { date: booking.checkIn  },
    end:              { date: booking.checkOut },
  };
  return apiFetch(`/calendars/${CAL}/events/${eventId}`, { method: 'PUT', body: JSON.stringify(body) });
}

/**
 * Deletes a booking event permanently.
 * @param {string} eventId
 */
export async function deleteEvent(eventId) {
  return apiFetch(`/calendars/${CAL}/events/${eventId}`, { method: 'DELETE' });
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/api.js
git commit -m "feat: Google Calendar API wrapper — fetch, create, update, delete events"
```

---

## Task 7: UI Helpers

**Files:**
- Write: `js/ui.js`

- [ ] **Step 1: Write `js/ui.js`**

```javascript
// js/ui.js

/** Shows a brief toast notification at the bottom of the screen. */
export function showToast(message, type = 'success') {
  // Remove any existing toast
  document.querySelector('.toast')?.remove();

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 3000);
}

/**
 * Shows a full-screen green flash for "Booking Saved!".
 * Automatically disappears after 2.2 seconds.
 */
export function showSuccessFlash(message = 'Booking Saved!') {
  const el = document.createElement('div');
  el.className = 'success-flash';
  el.innerHTML = `
    <div class="success-flash-icon">✅</div>
    <div class="success-flash-text">${message}</div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2300);
}

/**
 * Shows a modal confirmation dialog.
 * @param {string} title
 * @param {string} body
 * @param {string} confirmLabel
 * @returns {Promise<boolean>}  Resolves true if confirmed, false if cancelled.
 */
export function confirm(title, body, confirmLabel = 'Delete') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="dialog">
        <div class="dialog-title">${title}</div>
        <div class="dialog-body">${body}</div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel"  data-action="cancel">Cancel</button>
          <button class="dialog-btn confirm" data-action="confirm">${confirmLabel}</button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', e => {
      const action = e.target.dataset.action;
      if (!action) return;
      overlay.remove();
      resolve(action === 'confirm');
    });

    document.body.appendChild(overlay);
  });
}

/** Shows the loading spinner overlay. */
export function showLoading() {
  document.getElementById('loading')?.classList.remove('hidden');
}

/** Hides the loading spinner overlay. */
export function hideLoading() {
  document.getElementById('loading')?.classList.add('hidden');
}

/** Returns the first letter of a name, uppercased — used for the avatar. */
export function avatarInitial(name = '') {
  return (name.trim()[0] || '?').toUpperCase();
}

/** Formats today's date for the header (e.g. "Wed, 8 Apr 2026"). */
export function formatHeaderDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/ui.js
git commit -m "feat: UI helpers — toast, success flash, confirm dialog, loading spinner"
```

---

## Task 8: App Entry Point & Router

**Files:**
- Write: `js/app.js`

- [ ] **Step 1: Write `js/app.js`**

```javascript
// js/app.js
import { isAuthenticated, getCurrentUser, initAuth, signOut } from './auth.js';
import { fetchAllEvents } from './api.js';
import { showToast, showLoading, hideLoading } from './ui.js';
import { renderLogin } from './screens/login.js';
import { renderHome  } from './screens/home.js';
import { renderRoom  } from './screens/room.js';
import { renderBooking } from './screens/booking.js';

// ---- Global app state ----
// Shared across all screens — avoids redundant API calls on navigation.
export const state = {
  user:    null,      // { name, email }
  events:  [],        // Raw Google Calendar event objects
  loading: false,
};

const app = document.getElementById('app');

// ---- Router ----
// Routes: #home, #room/GF-1, #booking/new, #booking/new/GF-1, #booking/edit/<eventId>
function route() {
  const hash = location.hash || '#home';
  const [, screen, ...rest] = hash.split('/');

  if (!isAuthenticated()) {
    _mountScreen(renderLogin({ onSignInSuccess: _onAuthSuccess, onSignInError: _onAuthError }));
    return;
  }

  switch (screen) {
    case '#home':
      _mountScreen(renderHome({ events: state.events, user: state.user, onAddBooking: () => navigate('#booking/new'), onRoomClick: (roomId) => navigate(`#room/${roomId}`) }));
      break;
    case '#room':
      _mountScreen(renderRoom({ roomId: rest[0], events: state.events, onBack: () => navigate('#home'), onAddBooking: (roomId) => navigate(`#booking/new/${roomId}`), onEditBooking: (eventId) => navigate(`#booking/edit/${eventId}`) }));
      break;
    case '#booking':
      _mountScreen(renderBooking({
        mode:    rest[0],             // 'new' or 'edit'
        roomId:  rest[0] === 'new' ? (rest[1] || null) : null,
        eventId: rest[0] === 'edit' ? rest[1] : null,
        events:  state.events,
        onBack:  () => history.back(),
        onSaved: _onBookingSaved,
        onDeleted: _onBookingDeleted,
      }));
      break;
    default:
      navigate('#home', true);
  }
}

export function navigate(hash, replace = false) {
  if (replace) history.replaceState(null, '', hash);
  else         history.pushState(null, '', hash);
  route();
}

// ---- Auth callbacks ----
async function _onAuthSuccess(user) {
  state.user = user;
  await _loadEvents();
  navigate('#home', true);
}

function _onAuthError(msg) {
  showToast(msg, 'error');
}

// ---- Data loading ----
export async function _loadEvents() {
  showLoading();
  try {
    state.events = await fetchAllEvents();
  } catch (err) {
    showToast('Could not load bookings. Please check your internet connection.', 'error');
    state.events = [];
  } finally {
    hideLoading();
  }
}

// ---- Booking callbacks ----
async function _onBookingSaved() {
  await _loadEvents();
  navigate('#home', true);
}

async function _onBookingDeleted() {
  await _loadEvents();
  navigate('#home', true);
}

// ---- Screen mounting ----
function _mountScreen(html) {
  // Preserve the loading overlay — clear everything else
  const loading = document.getElementById('loading');
  app.innerHTML = '';
  app.appendChild(loading);
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  // Move children into app (not the wrapper itself)
  while (wrapper.firstChild) app.appendChild(wrapper.firstChild);
  // Re-attach event listeners (screens return HTML strings; listeners are attached after mount)
  window.__attachListeners?.();
  window.__attachListeners = null;
}

// ---- Boot ----
async function boot() {
  window.addEventListener('popstate', route);

  if (isAuthenticated()) {
    state.user = getCurrentUser();
    await _loadEvents();
  }

  route();
  hideLoading();
}

boot();
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/app.js
git commit -m "feat: app entry point — hash router, auth guard, global state, screen mounting"
```

---

## Task 9: Login Screen

**Files:**
- Write: `js/screens/login.js`

- [ ] **Step 1: Write `js/screens/login.js`**

```javascript
// js/screens/login.js
import { initAuth, signIn } from '../auth.js';

/**
 * Returns the HTML string for the login screen.
 * Attaches event listeners via window.__attachListeners.
 */
export function renderLogin({ onSignInSuccess, onSignInError }) {
  // Initialise auth as soon as the screen renders
  window.__attachListeners = () => {
    // Wait for GSI library to load before initialising
    function tryInit() {
      if (typeof google !== 'undefined' && google.accounts) {
        initAuth(onSignInSuccess, onSignInError);
      } else {
        setTimeout(tryInit, 200);
      }
    }
    tryInit();

    document.getElementById('sign-in-btn')?.addEventListener('click', () => {
      document.getElementById('login-error').textContent = '';
      signIn();
    });
  };

  return `
    <div class="login-screen">
      <div class="login-logo">🏠</div>
      <div class="login-title">Room Bookings</div>
      <div class="login-sub">Chandigarh, India · 6 Rooms</div>
      <button class="login-btn" id="sign-in-btn">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
        Sign in with Google
      </button>
      <div class="login-error" id="login-error"></div>
    </div>
  `;
}
```

- [ ] **Step 2: Manually test — serve the app and open in browser**

```bash
cd "/Users/waffle/Calender App" && npm run serve
```

Open `http://localhost:8080` — you should see the dark login screen with the "Sign in with Google" button. The button won't fully work yet (needs real Client ID in config.js).

- [ ] **Step 3: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/screens/login.js
git commit -m "feat: login screen — Google sign-in button, error display"
```

---

## Task 10: Home Screen

**Files:**
- Write: `js/screens/home.js`

- [ ] **Step 1: Write `js/screens/home.js`**

```javascript
// js/screens/home.js
import { ROOMS } from '../model.js';
import { isOccupiedToday, parseDescription, formatDateDisplay } from '../model.js';
import { avatarInitial, formatHeaderDate } from '../ui.js';

/**
 * Builds room status from calendar events.
 * Returns Map<roomId, { occupied: bool, guest: string, checkOut: string }>
 */
function buildRoomStatus(events) {
  const status = new Map();
  ROOMS.forEach(r => status.set(r.id, { occupied: false, guest: '', checkOut: '' }));

  events.forEach(ev => {
    const start = ev.start?.date;
    const end   = ev.end?.date;
    if (!start || !end) return;

    if (!isOccupiedToday({ start, end })) return;

    const desc = parseDescription(ev.description || '');
    const roomId = desc.room || (ev.summary || '').split(' · ')[0];
    if (status.has(roomId)) {
      status.set(roomId, { occupied: true, guest: desc.guest || ev.summary?.split(' · ')[1] || '', checkOut: end });
    }
  });

  return status;
}

export function renderHome({ events, user, onAddBooking, onRoomClick }) {
  const status    = buildRoomStatus(events);
  const freeCount = [...status.values()].filter(s => !s.occupied).length;
  const occCount  = [...status.values()].filter(s =>  s.occupied).length;

  const floors = [
    { label: 'Ground Floor', rooms: ROOMS.filter(r => r.floor === 'Ground Floor') },
    { label: 'First Floor',  rooms: ROOMS.filter(r => r.floor === 'First Floor')  },
  ];

  const roomCards = floors.map(floor => `
    <div class="floor-label">${floor.label}</div>
    <div class="room-grid">
      ${floor.rooms.map(room => {
        const s = status.get(room.id);
        return `
          <div class="room-card ${s.occupied ? 'occupied' : 'free'}" data-room="${room.id}">
            <div class="room-card-bar"></div>
            <div class="room-name">${room.id}</div>
            <div class="status-badge ${s.occupied ? 'occupied' : 'free'}">
              ● ${s.occupied ? 'Occupied' : 'Free'}
            </div>
            ${s.occupied ? `<div class="room-guest-info">${s.guest}<br>Till ${formatDateDisplay(s.checkOut)}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  window.__attachListeners = () => {
    document.querySelectorAll('.room-card[data-room]').forEach(card => {
      card.addEventListener('click', () => onRoomClick(card.dataset.room));
    });
    document.getElementById('add-booking-btn')?.addEventListener('click', onAddBooking);
  };

  return `
    <div class="app-header">
      <div class="app-header-row">
        <div>
          <div class="app-header-title">Room Bookings</div>
          <div class="app-header-sub">Chandigarh · ${formatHeaderDate()}</div>
        </div>
        <div class="app-header-avatar">${avatarInitial(user?.name)}</div>
      </div>
    </div>
    <div class="stats-bar">
      <div class="stat-item"><div class="stat-num green">${freeCount}</div><div class="stat-label">Free</div></div>
      <div class="stat-item"><div class="stat-num red">${occCount}</div><div class="stat-label">Occupied</div></div>
      <div class="stat-item"><div class="stat-num blue">6</div><div class="stat-label">Total</div></div>
    </div>
    <div class="screen-body">
      ${roomCards}
    </div>
    <div class="btn-footer">
      <button class="btn-primary" id="add-booking-btn">
        <div class="btn-icon">+</div>
        Add New Booking
      </button>
    </div>
  `;
}
```

- [ ] **Step 2: Fix the guest name parsing in model.js**

The `parseDescription` function doesn't currently extract `guest`. Open `js/model.js` and update `parseDescription` to include `guest`:

```javascript
// In js/model.js, update parseDescription to include the guest field
export function parseDescription(description) {
  const map = {};
  (description || '').split('\n').forEach(line => {
    const idx = line.indexOf(': ');
    if (idx === -1) return;
    map[line.slice(0, idx).trim()] = line.slice(idx + 2).trim();
  });
  return {
    room:       map['ROOM']    || '',
    guest:      map['GUEST']   || '',      // ← add this line
    phone:      map['PHONE']   || '',
    guestCount: parseInt(map['GUESTS']) || 1,
    rent:       parseInt(map['RENT'])   || 0,
    payment:    map['PAYMENT'] || 'PENDING',
    notes:      map['NOTES']   || '',
  };
}
```

Also update `formatDescription` in `js/model.js` to include guest:

```javascript
export function formatDescription(booking) {
  return [
    `ROOM: ${booking.room}`,
    `GUEST: ${booking.guest || ''}`,       // ← add this line
    `PHONE: ${booking.phone || ''}`,
    `GUESTS: ${booking.guestCount || 1}`,
    `RENT: ${booking.rent || 0}`,
    `PAYMENT: ${booking.payment || 'PENDING'}`,
    `NOTES: ${booking.notes || ''}`,
  ].join('\n');
}
```

- [ ] **Step 3: Update model tests to cover guest field**

Add to `tests/model.test.js`:

```javascript
test('parses guest', () => expect(parseDescription(desc).guest).toBe('Raj Sharma'));
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
cd "/Users/waffle/Calender App" && npm test
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/screens/home.js js/model.js tests/model.test.js
git commit -m "feat: home screen — room grid, stats bar, occupancy from calendar events"
```

---

## Task 11: Room Detail Screen

**Files:**
- Write: `js/screens/room.js`

- [ ] **Step 1: Write `js/screens/room.js`**

```javascript
// js/screens/room.js
import { parseDescription, formatDateDisplay } from '../model.js';

/** Filters events for a specific room, sorted by check-in date. */
function getRoomBookings(events, roomId) {
  return events
    .filter(ev => {
      const desc = parseDescription(ev.description || '');
      const evRoom = desc.room || (ev.summary || '').split(' · ')[0];
      return evRoom === roomId;
    })
    .sort((a, b) => (a.start?.date || '').localeCompare(b.start?.date || ''));
}

export function renderRoom({ roomId, events, onBack, onAddBooking, onEditBooking }) {
  const bookings = getRoomBookings(events, roomId);

  const bookingItems = bookings.length === 0
    ? `<div class="empty-state">No upcoming bookings for ${roomId}.<br>Tap + to add one.</div>`
    : bookings.map(ev => {
        const desc = parseDescription(ev.description || '');
        return `
          <div class="booking-item" data-event-id="${ev.id}">
            <div class="booking-guest">${desc.guest || 'Unknown Guest'}</div>
            <div class="booking-dates">
              ${formatDateDisplay(ev.start?.date)} → ${formatDateDisplay(ev.end?.date)}
            </div>
            <div class="booking-meta">
              <span class="booking-rent">₹${Number(desc.rent).toLocaleString('en-IN')}</span>
              <span class="payment-chip ${desc.payment === 'PAID' ? 'paid' : 'pending'}">
                ${desc.payment === 'PAID' ? '✓ Paid' : '⏳ Pending'}
              </span>
            </div>
          </div>
        `;
      }).join('');

  window.__attachListeners = () => {
    document.getElementById('back-btn')?.addEventListener('click', onBack);
    document.getElementById('add-for-room-btn')?.addEventListener('click', () => onAddBooking(roomId));
    document.querySelectorAll('.booking-item[data-event-id]').forEach(item => {
      item.addEventListener('click', () => onEditBooking(item.dataset.eventId));
    });
  };

  return `
    <div class="app-header">
      <div class="app-header-row">
        <button class="app-header-back" id="back-btn">←</button>
        <div>
          <div class="app-header-title">Room ${roomId}</div>
          <div class="app-header-sub">Bookings</div>
        </div>
        <div style="width:40px;"></div>
      </div>
    </div>
    <div class="screen-body">
      ${bookingItems}
    </div>
    <div class="btn-footer">
      <button class="btn-primary" id="add-for-room-btn">
        <div class="btn-icon">+</div>
        Add Booking for ${roomId}
      </button>
    </div>
  `;
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/screens/room.js
git commit -m "feat: room detail screen — booking list per room, sorted by date"
```

---

## Task 12: Add / Edit Booking Screen with Date Picker

**Files:**
- Write: `js/screens/booking.js`

This is the most complex screen. It includes the inline date range picker.

- [ ] **Step 1: Write `js/screens/booking.js`**

```javascript
// js/screens/booking.js
import { ROOMS, parseDescription, formatDateDisplay, toDateStr } from '../model.js';
import { createEvent, updateEvent, deleteEvent } from '../api.js';
import { showSuccessFlash, showToast, confirm } from '../ui.js';

// ---- Date picker state ----
let _pickerState = {
  viewYear:  0,
  viewMonth: 0,
  checkIn:   null,  // YYYY-MM-DD string
  checkOut:  null,
  step:      0,     // 0 = selecting check-in, 1 = selecting check-out
  bookedRanges: [], // [{ start, end }] for the selected room (excluding current edit event)
};

// ---- Booking form state ----
let _form = {
  room: '', guest: '', phone: '', guestCount: 1,
  rent: '', payment: 'PAID', notes: '',
};
let _eventId    = null;
let _callbacks  = {};
let _allEvents  = [];

export function renderBooking({ mode, roomId, eventId, events, onBack, onSaved, onDeleted }) {
  _allEvents  = events;
  _callbacks  = { onBack, onSaved, onDeleted };
  _eventId    = eventId;

  const today = new Date();
  _pickerState.viewYear  = today.getFullYear();
  _pickerState.viewMonth = today.getMonth();

  // Populate form for edit mode
  if (mode === 'edit' && eventId) {
    const ev   = events.find(e => e.id === eventId);
    const desc = parseDescription(ev?.description || '');
    _form = {
      room:       desc.room || (ev?.summary || '').split(' · ')[0],
      guest:      desc.guest || '',
      phone:      desc.phone || '',
      guestCount: desc.guestCount || 1,
      rent:       String(desc.rent || ''),
      payment:    desc.payment || 'PAID',
      notes:      desc.notes || '',
    };
    _pickerState.checkIn  = ev?.start?.date || null;
    _pickerState.checkOut = ev?.end?.date   || null;
    _pickerState.step = 2; // dates already selected
  } else {
    _form = {
      room: roomId || ROOMS[0].id, guest: '', phone: '',
      guestCount: 1, rent: '', payment: 'PAID', notes: '',
    };
    _pickerState.checkIn  = null;
    _pickerState.checkOut = null;
    _pickerState.step = 0;
  }

  _updateBookedRanges();

  window.__attachListeners = _attachAllListeners;

  const isEdit     = mode === 'edit';
  const roomLocked = mode === 'new' && !!roomId;

  return `
    <div class="app-header">
      <div class="app-header-row">
        <button class="app-header-back" id="back-btn">←</button>
        <div>
          <div class="app-header-title">${isEdit ? 'Edit Booking' : 'New Booking'}</div>
        </div>
        <div style="width:40px;"></div>
      </div>
      <div class="header-room-chip" id="header-room-chip">Room ${_form.room}</div>
    </div>
    <div class="screen-body">

      <div class="field-group">
        <label class="field-label" for="f-room">Room</label>
        <select class="field-input" id="f-room" ${roomLocked ? 'disabled' : ''}>
          ${ROOMS.map(r => `<option value="${r.id}" ${r.id === _form.room ? 'selected' : ''}>${r.id} — ${r.floor}</option>`).join('')}
        </select>
      </div>

      <div class="field-group">
        <label class="field-label" for="f-guest">Guest Name</label>
        <input class="field-input" id="f-guest" type="text" placeholder="e.g. Raj Sharma" value="${_form.guest}" autocomplete="off">
      </div>

      <div class="field-group">
        <label class="field-label" for="f-phone">Phone Number</label>
        <input class="field-input" id="f-phone" type="tel" placeholder="+91 98765 43210" value="${_form.phone}">
      </div>

      <div class="field-group">
        <label class="field-label">Check-in → Check-out</label>
        <div class="cal-instruction" id="cal-instruction">${_getCalInstruction()}</div>
        <div class="date-chips">
          <div class="date-chip ${_pickerState.step === 0 ? 'active' : ''}">
            <div class="date-chip-label">Check-in</div>
            <div class="date-chip-value ${!_pickerState.checkIn ? 'placeholder' : ''}" id="chip-checkin">
              ${_pickerState.checkIn ? formatDateDisplay(_pickerState.checkIn) : 'Select date'}
            </div>
          </div>
          <div class="date-chip ${_pickerState.step === 1 ? 'active' : ''}">
            <div class="date-chip-label">Check-out</div>
            <div class="date-chip-value ${!_pickerState.checkOut ? 'placeholder' : ''}" id="chip-checkout">
              ${_pickerState.checkOut ? formatDateDisplay(_pickerState.checkOut) : 'Select date'}
            </div>
          </div>
        </div>
        <div class="mini-cal" id="mini-cal">
          ${_renderCalendar()}
        </div>
      </div>

      <div class="field-group">
        <label class="field-label" for="f-guests">Number of Guests</label>
        <input class="field-input" id="f-guests" type="number" min="1" max="20" value="${_form.guestCount}" placeholder="1">
      </div>

      <div class="field-group">
        <label class="field-label" for="f-rent">Rent Amount (₹)</label>
        <input class="field-input" id="f-rent" type="number" min="0" placeholder="e.g. 12000" value="${_form.rent}">
      </div>

      <div class="field-group">
        <label class="field-label">Payment Status</label>
        <div class="payment-toggle">
          <div class="payment-opt ${_form.payment === 'PAID' ? 'selected-paid' : ''}" data-payment="PAID">
            <div class="payment-opt-icon">✅</div>
            <div class="payment-opt-label">Paid</div>
          </div>
          <div class="payment-opt ${_form.payment === 'PENDING' ? 'selected-pending' : ''}" data-payment="PENDING">
            <div class="payment-opt-icon">⏳</div>
            <div class="payment-opt-label">Pending</div>
          </div>
        </div>
      </div>

      <div class="field-group">
        <label class="field-label" for="f-notes">Notes (Optional)</label>
        <textarea class="field-input" id="f-notes" placeholder="Any extra details...">${_form.notes}</textarea>
      </div>

      <button class="btn-primary" id="save-btn">Save Booking to Calendar</button>
      ${isEdit ? `<button class="btn-danger" id="delete-btn">Delete Booking</button>` : ''}

    </div>
  `;
}

// ---- Calendar rendering ----

function _renderCalendar() {
  const { viewYear, viewMonth } = _pickerState;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Days in month, first weekday
  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today     = toDateStr(new Date());

  let dayCells = '';
  // Empty cells before the 1st
  for (let i = 0; i < firstDay; i++) dayCells += `<div class="cal-day"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cls     = _getDayClass(dateStr, today);
    dayCells += `<div class="cal-day ${cls}" data-date="${dateStr}">${d}</div>`;
  }

  return `
    <div class="cal-header">
      <button class="cal-nav" id="cal-prev">‹</button>
      <span>${months[viewMonth]} ${viewYear}</span>
      <button class="cal-nav" id="cal-next">›</button>
    </div>
    <div class="cal-grid">
      <div class="cal-weekdays">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>
      <div class="cal-days" id="cal-days">${dayCells}</div>
    </div>
  `;
}

function _getDayClass(dateStr, today) {
  const { checkIn, checkOut, bookedRanges } = _pickerState;
  const classes = [];

  if (dateStr < today) classes.push('past');
  if (dateStr === today) classes.push('today');
  if (_isBooked(dateStr, bookedRanges)) classes.push('booked');
  if (checkIn  && dateStr === checkIn)  classes.push('check-in');
  if (checkOut && dateStr === checkOut) classes.push('check-out');
  if (checkIn && checkOut && dateStr > checkIn && dateStr < checkOut) classes.push('in-range');

  return classes.join(' ');
}

function _isBooked(dateStr, ranges) {
  return ranges.some(r => dateStr >= r.start && dateStr < r.end);
}

function _getCalInstruction() {
  if (_pickerState.step === 0) return 'Tap a date to set Check-in';
  if (_pickerState.step === 1) return 'Now tap a date to set Check-out';
  return 'Tap Check-in date above to change';
}

// ---- Listener attachment ----

function _attachAllListeners() {
  document.getElementById('back-btn')?.addEventListener('click', _callbacks.onBack);

  // Room selector
  document.getElementById('f-room')?.addEventListener('change', e => {
    _form.room = e.target.value;
    document.getElementById('header-room-chip').textContent = `Room ${_form.room}`;
    _updateBookedRanges();
    _pickerState.checkIn = null;
    _pickerState.checkOut = null;
    _pickerState.step = 0;
    _refreshCalendar();
    _refreshChips();
  });

  // Calendar navigation
  document.getElementById('mini-cal')?.addEventListener('click', e => {
    if (e.target.id === 'cal-prev') {
      _pickerState.viewMonth--;
      if (_pickerState.viewMonth < 0) { _pickerState.viewMonth = 11; _pickerState.viewYear--; }
      _refreshCalendar();
    } else if (e.target.id === 'cal-next') {
      _pickerState.viewMonth++;
      if (_pickerState.viewMonth > 11) { _pickerState.viewMonth = 0; _pickerState.viewYear++; }
      _refreshCalendar();
    } else if (e.target.dataset.date) {
      _onDayClick(e.target.dataset.date, e.target);
    }
  });

  // Payment toggle
  document.querySelectorAll('.payment-opt[data-payment]').forEach(opt => {
    opt.addEventListener('click', () => {
      _form.payment = opt.dataset.payment;
      document.querySelectorAll('.payment-opt').forEach(o => {
        o.classList.remove('selected-paid', 'selected-pending');
      });
      opt.classList.add(`selected-${_form.payment.toLowerCase()}`);
    });
  });

  // Save button
  document.getElementById('save-btn')?.addEventListener('click', _onSave);

  // Delete button
  document.getElementById('delete-btn')?.addEventListener('click', _onDelete);
}

function _onDayClick(dateStr, el) {
  if (el.classList.contains('past') || el.classList.contains('booked') || el.classList.contains('other-month')) return;

  const { step } = _pickerState;

  if (step === 0 || step === 2) {
    // Selecting check-in — reset checkout too
    _pickerState.checkIn  = dateStr;
    _pickerState.checkOut = null;
    _pickerState.step = 1;
  } else {
    // Selecting check-out
    if (dateStr <= _pickerState.checkIn) {
      // Swap: treat click as new check-in
      _pickerState.checkIn  = dateStr;
      _pickerState.checkOut = null;
      _pickerState.step = 1;
    } else if (_hasBookedDatesInRange(_pickerState.checkIn, dateStr)) {
      showToast('Those dates overlap an existing booking for this room.', 'error');
    } else {
      _pickerState.checkOut = dateStr;
      _pickerState.step = 2;
    }
  }

  _refreshCalendar();
  _refreshChips();
}

function _hasBookedDatesInRange(start, end) {
  return _pickerState.bookedRanges.some(r => r.start < end && r.end > start);
}

function _refreshCalendar() {
  const cal = document.getElementById('mini-cal');
  if (cal) {
    cal.innerHTML = _renderCalendar();
    // Re-attach nav listener (replaced inner HTML)
  }
  const instr = document.getElementById('cal-instruction');
  if (instr) instr.textContent = _getCalInstruction();
}

function _refreshChips() {
  const ci = document.getElementById('chip-checkin');
  const co = document.getElementById('chip-checkout');
  if (ci) {
    ci.textContent = _pickerState.checkIn ? formatDateDisplay(_pickerState.checkIn) : 'Select date';
    ci.classList.toggle('placeholder', !_pickerState.checkIn);
  }
  if (co) {
    co.textContent = _pickerState.checkOut ? formatDateDisplay(_pickerState.checkOut) : 'Select date';
    co.classList.toggle('placeholder', !_pickerState.checkOut);
  }
}

function _updateBookedRanges() {
  const roomId = _form.room;
  _pickerState.bookedRanges = _allEvents
    .filter(ev => {
      const desc  = parseDescription(ev.description || '');
      const evRoom = desc.room || (ev.summary || '').split(' · ')[0];
      // Exclude the event being edited
      return evRoom === roomId && ev.id !== _eventId;
    })
    .map(ev => ({ start: ev.start?.date, end: ev.end?.date }))
    .filter(r => r.start && r.end);
}

// ---- Save & Delete ----

async function _onSave() {
  // Read form values
  _form.guest      = document.getElementById('f-guest')?.value.trim() || '';
  _form.phone      = document.getElementById('f-phone')?.value.trim() || '';
  _form.guestCount = parseInt(document.getElementById('f-guests')?.value) || 1;
  _form.rent       = document.getElementById('f-rent')?.value.trim() || '0';
  _form.notes      = document.getElementById('f-notes')?.value.trim() || '';

  // Validation
  if (!_form.guest) { showToast('Please enter the guest name.', 'error'); return; }
  if (!_pickerState.checkIn)  { showToast('Please select a check-in date.', 'error'); return; }
  if (!_pickerState.checkOut) { showToast('Please select a check-out date.', 'error'); return; }

  const booking = {
    room:       _form.room,
    guest:      _form.guest,
    phone:      _form.phone,
    guestCount: _form.guestCount,
    rent:       parseInt(_form.rent) || 0,
    payment:    _form.payment,
    notes:      _form.notes,
    checkIn:    _pickerState.checkIn,
    checkOut:   _pickerState.checkOut,
  };

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  try {
    if (_eventId) {
      await updateEvent(_eventId, booking);
    } else {
      await createEvent(booking);
    }
    showSuccessFlash('Booking Saved!');
    setTimeout(() => _callbacks.onSaved(), 2000);
  } catch (err) {
    showToast('Could not save booking. Please check your internet connection.', 'error');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Booking to Calendar'; }
  }
}

async function _onDelete() {
  const ok = await confirm(
    'Delete Booking?',
    'This will permanently remove the booking from Google Calendar.',
    'Delete'
  );
  if (!ok) return;

  try {
    await deleteEvent(_eventId);
    showToast('Booking Deleted', 'error');
    setTimeout(() => _callbacks.onDeleted(), 1500);
  } catch (err) {
    showToast('Could not delete booking. Please check your internet connection.', 'error');
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/waffle/Calender App"
git add js/screens/booking.js
git commit -m "feat: add/edit booking screen — inline date picker, validation, save/delete to Google Calendar"
```

---

## Task 13: PWA Icons & Service Worker

**Files:**
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`
- Write: `sw.js`

- [ ] **Step 1: Generate icons**

Create a simple icon using an online tool or the script below. Run this Node.js script to create placeholder icons using the Canvas API:

```bash
cd "/Users/waffle/Calender App"
node -e "
const { createCanvas } = require('canvas');
const fs = require('fs');

function makeIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  // Background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, size, size);
  // House emoji rendered as text
  ctx.font = \`\${size * 0.55}px serif\`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏠', size/2, size/2);
  return c.toBuffer('image/png');
}

fs.writeFileSync('icons/icon-192.png', makeIcon(192));
fs.writeFileSync('icons/icon-512.png', makeIcon(512));
console.log('Icons created');
"
```

If `canvas` npm package is not available, use a free online tool instead: go to [favicon.io](https://favicon.io/emoji-favicons/) → search 🏠 → download → resize to 192×192 and 512×512 → save to `icons/`.

- [ ] **Step 2: Write `sw.js`**

```javascript
// sw.js — Service Worker for Room Bookings PWA
const CACHE_NAME = 'room-bookings-v1';

// App shell files to cache
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/model.js',
  '/js/auth.js',
  '/js/api.js',
  '/js/ui.js',
  '/js/screens/login.js',
  '/js/screens/home.js',
  '/js/screens/room.js',
  '/js/screens/booking.js',
  '/config.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell, network-first for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for Google APIs and fonts
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('accounts.google.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    return; // let browser handle it normally
  }

  // Cache-first for app shell
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
```

- [ ] **Step 3: Register the service worker in `index.html`**

Add this script block just before `</body>` in `index.html`, after the existing `<script>` tag:

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .catch(err => console.warn('SW registration failed:', err));
    });
  }
</script>
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/waffle/Calender App"
git add icons/ sw.js index.html
git commit -m "feat: PWA service worker, icons, app shell caching — installable on Android and iPhone"
```

---

## Task 14: GitHub Pages Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
.DS_Store
.superpowers/
*.log
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'   # Deploy the whole repo root

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit everything and push**

```bash
cd "/Users/waffle/Calender App"
git add .gitignore .github/
git commit -m "feat: GitHub Pages deploy workflow — auto-deploys on push to main"
```

- [ ] **Step 4: Create a GitHub repo and push**

```bash
cd "/Users/waffle/Calender App"
# Create the repo on GitHub first at https://github.com/new
# Then:
git remote add origin https://github.com/YOUR_USERNAME/room-bookings.git
git push -u origin main
```

- [ ] **Step 5: Enable GitHub Pages**

1. Go to your GitHub repo → Settings → Pages
2. Source: "GitHub Actions"
3. Wait ~2 minutes for the first deploy
4. Your app will be live at `https://YOUR_USERNAME.github.io/room-bookings/`

- [ ] **Step 6: Update Google Cloud Console with the live URL**

Go back to Google Cloud Console → APIs & Services → Credentials → your OAuth client → add the live URL:
- Authorized JavaScript origins: `https://YOUR_USERNAME.github.io`
- Authorized redirect URIs: `https://YOUR_USERNAME.github.io`

---

## Task 15: End-to-End Manual Testing

- [ ] **Step 1: Test on laptop (Chrome)**

Open `http://localhost:8080` (run `npm run serve`):
- [ ] Login screen appears ✓
- [ ] "Sign in with Google" button works, authenticates with your Gmail ✓
- [ ] Unauthorised email shows "Access not authorised" ✓
- [ ] Home screen shows all 6 rooms ✓
- [ ] Stats bar counts are correct ✓
- [ ] Tapping a room card opens Room Detail ✓
- [ ] Adding a booking → fills form → saves → shows "Booking Saved!" ✓
- [ ] Saved booking appears in Google Calendar ✓
- [ ] Editing a booking pre-fills the form ✓
- [ ] Deleting a booking removes it from Google Calendar ✓
- [ ] Double-booking prevention: booked dates shown in red in picker ✓

- [ ] **Step 2: Test on Android phone**

Open Chrome on Android → navigate to the GitHub Pages URL:
- [ ] Page loads correctly ✓
- [ ] "Add to Home Screen" prompt appears (or use browser menu) ✓
- [ ] App installs and opens full-screen ✓
- [ ] One-tap Google sign-in works ✓
- [ ] All text is readable (≥ 18px) ✓
- [ ] All buttons are large enough to tap comfortably ✓

- [ ] **Step 3: Test on iPhone (Safari)**

- [ ] Page loads correctly ✓
- [ ] Share → Add to Home Screen → app installs ✓
- [ ] Google sign-in works (opens popup) ✓
- [ ] Bookings sync correctly with other devices ✓

---

## Summary

The app is complete when:
1. All unit tests pass (`npm test`)
2. All 3 manager Gmail addresses can sign in
3. Bookings created in the app appear in the shared Google Calendar
4. Bookings appear correctly on the Home screen room cards
5. The app is installable as a PWA on Android and iPhone
6. The app is live at the GitHub Pages URL
