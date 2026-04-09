# Room Bookings App — Setup & Testing Guide

A step-by-step guide to go from this code to a live app your managers can use.

---

## Before You Start

You will need:
- A Google account (yours — used to create the project)
- A GitHub account (to host the app for free)
- About 20 minutes

---

## Step 1 — Push to GitHub

1. Create a new **public** repository on [github.com](https://github.com) — name it anything, e.g. `room-bookings`
2. In your terminal, from this folder:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/room-bookings.git
   git branch -M main
   git push -u origin main
   ```
3. Go to your repo on GitHub → **Settings** → **Pages** → under "Source" select **GitHub Actions** → Save

Your app will be live at: `https://YOUR_USERNAME.github.io/room-bookings/`

---

## Step 2 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project selector at the top → **New Project**
   - Name: `Room Bookings`
   - Click **Create**

---

## Step 3 — Enable Google Calendar API

1. In your project, go to **APIs & Services** → **Library**
2. Search for **Google Calendar API** → click it → click **Enable**

---

## Step 4 — Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. If prompted to configure the consent screen first:
   - User type: **External** → Create
   - App name: `Room Bookings`
   - Support email: your email
   - Click **Save and Continue** through the rest (scopes can be skipped for now)
3. Back at Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Room Bookings App`
   - **Authorized JavaScript origins** — add both:
     ```
     https://YOUR_USERNAME.github.io
     http://localhost:8080
     ```
   - **Authorized redirect URIs** — add both:
     ```
     https://YOUR_USERNAME.github.io
     http://localhost:8080
     ```
   - Click **Create**
4. Copy the **Client ID** — looks like `123456789-abc.apps.googleusercontent.com`

---

## Step 5 — Create the Shared Google Calendar

1. Go to [calendar.google.com](https://calendar.google.com)
2. On the left sidebar, click **+** next to "Other calendars" → **Create new calendar**
   - Name: `Room Bookings Chandigarh`
   - Click **Create calendar**
3. Find the new calendar in the left sidebar → click the three-dot menu → **Settings and sharing**
4. Under **Share with specific people**, add all 3 managers' Gmail addresses — give each **Make changes to events** permission
5. Scroll down to **Integrate calendar** → copy the **Calendar ID** — looks like `abc123@group.calendar.google.com`

---

## Step 6 — Fill in config.js

Open `config.js` in this folder and replace the placeholder values:

```javascript
const CONFIG = {
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',   // ← paste from Step 4
  CALENDAR_ID: 'YOUR_CALENDAR_ID@group.calendar.google.com', // ← paste from Step 5
  ALLOWED_EMAILS: [
    'manager1@gmail.com',   // ← first manager's Gmail
    'manager2@gmail.com',   // ← second manager's Gmail
    'manager3@gmail.com',   // ← third manager's Gmail
  ],
  FETCH_DAYS_AHEAD: 180,
};
export default CONFIG;
```

> **Important:** `config.js` is in `.gitignore` — it will NOT be uploaded to GitHub. This is intentional, to keep your credentials private. The app loads it as a local file.
>
> To deploy it, you have two options:
> - **Option A (simplest):** Manually upload `config.js` to your GitHub repo as a one-time step (go to github.com → your repo → Add file → Upload files)
> - **Option B (GitHub Actions secret — more secure):** Add your config values as repository secrets and modify the deploy workflow to generate `config.js` at deploy time

For a private 3-person app, **Option A** is fine.

---

## Step 7 — Deploy

After filling in `config.js` and uploading it (or committing it if you chose Option A):

```bash
git add config.js
git commit -m "feat: add real config"
git push
```

GitHub Actions will deploy automatically. Check progress at: `https://github.com/YOUR_USERNAME/room-bookings/actions`

Wait ~1 minute, then open: `https://YOUR_USERNAME.github.io/room-bookings/`

---

## Step 8 — Local Testing (optional, before deploy)

To test locally before pushing:

```bash
# Install dev tools (one time)
npm install

# Start local server
npm run serve
```

Open [http://localhost:8080](http://localhost:8080) in Chrome.

---

## Manual Testing Checklist

Run through these checks after deploying. Tick each one off.

### On Laptop (Chrome)

- [ ] Login screen appears with "Sign in with Google" button
- [ ] Sign in with an **allowed** Gmail — home screen loads
- [ ] Home screen shows all 6 rooms (GF-1, GF-2, GF-3, GF-4, FF-1, FF-2)
- [ ] Stats bar shows correct Free / Occupied / Total counts
- [ ] Tap a room card → Room Detail screen opens
- [ ] Room Detail shows "No bookings yet" for an empty room
- [ ] Tap "+" on Room Detail → Add Booking form opens with room pre-filled
- [ ] Fill in: Guest Name, Phone, Check-in date, Check-out date, Rent, Payment status
- [ ] Tap "Save Booking to Calendar" → full-screen green "Booking Saved!" appears
- [ ] Open [calendar.google.com](https://calendar.google.com) → the new event is there with correct details
- [ ] Back on Home screen, the room now shows "Occupied" with the guest name
- [ ] Tap the booking in Room Detail → Edit Booking form opens with all fields pre-filled
- [ ] Change the rent amount → Save → event updates in Google Calendar
- [ ] Delete button → confirmation dialog appears → confirm → booking removed
- [ ] Google Calendar no longer has the event
- [ ] Add a booking for a room for specific dates → try adding another booking for overlapping dates → overlapping days show in red and cannot be selected
- [ ] Sign out (tap avatar initial in top-right corner)
- [ ] Try signing in with a Gmail **not** on the allowed list → "Access not authorised" message appears

### On Android (Chrome)

- [ ] Open Chrome → navigate to `https://YOUR_USERNAME.github.io/room-bookings/`
- [ ] Page loads and login screen appears
- [ ] Chrome shows "Add to Home Screen" banner (or tap ⋮ menu → Add to Home Screen)
- [ ] App installs on home screen with the house icon
- [ ] Open the installed app — it opens full-screen (no browser chrome)
- [ ] Sign in works with one tap (Google account already on device)
- [ ] All text is large and readable — nothing feels tiny
- [ ] All buttons are easy to tap with a thumb
- [ ] Add a booking → saves correctly
- [ ] Home screen room cards update to show Occupied

### On iPhone (Safari)

- [ ] Open Safari → navigate to `https://YOUR_USERNAME.github.io/room-bookings/`
- [ ] Page loads and login screen appears
- [ ] Tap the Share button (box with arrow) → **Add to Home Screen**
- [ ] App installs on home screen
- [ ] Open the installed app — it opens full-screen
- [ ] Sign in works (Google OAuth popup opens, you sign in, popup closes)
- [ ] Bookings created on Android/laptop appear here too (shared calendar)
- [ ] Add a booking from iPhone → it appears on other devices

---

## Troubleshooting

**"Access not authorised" for a manager who should have access**
→ Check `config.js` — make sure their Gmail address is spelled correctly in `ALLOWED_EMAILS`

**"Sign in" button does nothing / error in console**
→ Check that the GitHub Pages URL is listed in **Authorized JavaScript origins** in Google Cloud Console (Step 4). After adding it, wait a few minutes.

**Booking saves but doesn't appear in Google Calendar**
→ Check that the `CALENDAR_ID` in `config.js` matches the calendar you shared. Also verify the calendar is shared with the manager's Gmail (Step 5).

**App loads but shows a blank screen**
→ Open Chrome DevTools (F12) → Console tab → look for red errors. Most likely a config issue.

**"Error loading bookings" on home screen**
→ The Google Calendar API may not be enabled. Go to Google Cloud Console → APIs & Services → Library → enable Google Calendar API.

**PWA not showing install prompt on Android**
→ The app must be served over HTTPS (GitHub Pages is always HTTPS). Make sure you're using the `https://` URL, not `http://`.

---

## What Each Manager Needs To Do (One Time)

Send this message to each manager:

> "Open this link on your phone: https://YOUR_USERNAME.github.io/room-bookings/
>
> Sign in with your Gmail. You may need to tap 'Add to Home Screen' (or 'Add to Homescreen') to install it — then open it from there like a normal app. That's it!"

They do not need to install anything from the App Store or Play Store.

---

## Summary

The app is ready when:

- [ ] All 3 managers can sign in with their Gmail
- [ ] Bookings created by one manager appear for the other managers
- [ ] Bookings appear in the shared Google Calendar
- [ ] Home screen room cards show correct Occupied / Free status
- [ ] The app is installed on Android and iPhone home screens
