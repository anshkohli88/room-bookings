# Room Booking App — Design Spec
**Date**: 2026-04-08  
**Project**: Airbnb Room Booking Record Keeper — Chandigarh, India

---

## Overview

A mobile-first Progressive Web App (PWA) for tracking room bookings across 6 rooms in Chandigarh. Three managers can log in with Google and view or create bookings. All booking data is stored in a single shared Google Calendar — no backend, no database, no third-party booking platform integration.

---

## Rooms

| ID   | Floor        |
|------|--------------|
| GF-1 | Ground Floor |
| GF-2 | Ground Floor |
| GF-3 | Ground Floor |
| GF-4 | Ground Floor |
| FF-1 | First Floor  |
| FF-2 | First Floor  |

---

## Tech Stack

- **Type**: Progressive Web App (PWA) — installable on Android, iPhone, laptop
- **Code**: Plain HTML, CSS, JavaScript (no framework)
- **Hosting**: GitHub Pages (free, zero maintenance)
- **Auth**: Google OAuth 2.0 (Sign in with Google)
- **Data store**: Google Calendar API (one shared calendar)
- **Language**: English only

---

## Authentication

- Login screen shows a single "Sign in with Google" button
- On Android the sign-in is one tap (device already knows the Google account)
- On iPhone and laptop it opens the standard Google OAuth popup
- Access is restricted to the 3 managers' Gmail addresses — configured as a whitelist in the app config
- The shared Google Calendar is shared with all 3 managers' Gmail addresses (done once in Google Calendar settings)
- No separate app password or PIN needed

---

## Screens

### 1. Login Screen
- Full-screen, centred layout
- App name + "Sign in with Google" button
- Shown only when the user is not authenticated

### 2. Home Screen
- **Header**: App name ("Room Bookings"), location ("Chandigarh"), today's date, user avatar initial
- **Stats bar**: Free count · Occupied count · Total (6)
- **Room grid**:
  - Ground Floor label + 2×2 grid (GF-1, GF-2, GF-3, GF-4)
  - First Floor label + 1×2 row (FF-1, FF-2)
  - Each card shows: room name, status badge (Free / Occupied), and if occupied: guest name + checkout date
  - Green left border + green badge = Free
  - Red left border + red badge = Occupied
- **Add New Booking button**: Full-width, blue, at the bottom
- Tapping a room card navigates to the Room Detail screen

### 3. Room Detail Screen
- Header: back arrow + room name
- List of upcoming and current bookings for that room, sorted by check-in date
- Each booking row shows: guest name, check-in → check-out, rent (₹), payment status chip
- Floating "+" button to add a booking for this room
- Tap a booking row → Edit Booking screen

### 4. Add / Edit Booking Screen
- Header: "New Booking" or "Edit Booking" + room chip (e.g. "Room GF-1")
- Back arrow to cancel
- Fields (all large, min 18px text, min 48px tap height):
  - **Room** (dropdown selector — pre-filled and locked when accessed from a room card or Room Detail screen; editable when accessed from the global "Add New Booking" button on Home)
  - **Guest Name** (text input)
  - **Phone Number** (tel input, +91 prefix)
  - **Check-in / Check-out** (inline calendar date range picker — see below)
  - **Number of Guests** (number input)
  - **Rent Amount ₹** (number input)
  - **Payment Status** (two large toggle buttons: Paid / Pending)
  - **Notes** (multiline text input, optional)
- **Save button**: "Save Booking to Calendar" — full-width, blue
- **Delete button** (Edit mode only): red, below Save, requires a confirmation tap ("Delete this booking?")

### 5. Calendar Date Picker (inline, within Add/Edit screen)
- Shows current month with prev/next navigation
- Today highlighted in blue
- Already-booked dates for this room shown in red and non-selectable (prevents double booking)
- Tap check-in date → tap check-out date → range highlighted in blue
- Selected check-in and check-out shown in two summary chips below the calendar

---

## Data Model

Each booking is stored as a single Google Calendar event:

| Calendar field | Value |
|----------------|-------|
| Title          | `GF-1 · Raj Sharma` (room ID · guest name) |
| Start date     | Check-in date |
| End date       | Check-out date |
| Color          | Fixed per room (6 distinct colours) |
| Description    | Structured block (see below) |

**Description format** (machine-readable, also human-readable in Google Calendar):
```
ROOM: GF-1
GUEST: Raj Sharma
PHONE: +91 98765 43210
GUESTS: 2
RENT: 12000
PAYMENT: PAID
NOTES: Late checkout requested
```

The app parses this description to reconstruct booking data when reading events from the API.

### Room colours (Google Calendar event colours)
| Room | Colour      |
|------|-------------|
| GF-1 | Tomato      |
| GF-2 | Flamingo    |
| GF-3 | Tangerine   |
| GF-4 | Banana      |
| FF-1 | Sage        |
| FF-2 | Peacock     |

---

## UX Principles (70+ year old friendly)

- Minimum font size: **18px** throughout; room names 22px+
- All interactive elements minimum **48px tall**
- No hover-only interactions — everything works by tap/click
- Confirmation dialog before any destructive action (delete)
- After saving a booking: full-screen "Booking Saved!" green confirmation for 2 seconds
- After deleting: brief red "Booking Deleted" toast
- No pagination — all rooms visible on one screen
- Error messages in plain English ("Could not save booking. Please check your internet connection.")

---

## Visual Design

- **Colour scheme**: Midnight Slate
  - Header background: `#0F172A` → `#1E293B` (gradient)
  - Primary action (buttons, highlights): `#3B82F6` (electric blue)
  - Free status: `#10B981` (emerald green)
  - Occupied status: `#EF4444` (red)
  - Background: `#F8FAFC` (near white)
  - Cards: `#FFFFFF` with subtle shadow
  - Text: `#0F172A` (near black), secondary `#64748B`
- **Typography**: Playfair Display (headings/room names) + DM Sans (body/labels)
- **Border radius**: 12–14px on cards, 12px on inputs, 20px on badges

---

## PWA Configuration

- `manifest.json`: app name, icons, `display: standalone`, theme colour `#0F172A`
- `service-worker.js`: caches app shell (HTML, CSS, JS) for offline load; data fetches always go live
- App is installable via browser "Add to Home Screen" prompt
- Works on Android (Chrome), iPhone (Safari), laptop (any browser)

---

## Access Control

- A hardcoded array of allowed Gmail addresses in `config.js` acts as the whitelist
- After Google sign-in, the app checks `user.email` against the whitelist
- If not on the list: sign out immediately and show "Access not authorised" message
- The shared Google Calendar is separately shared (view + edit) with all 3 Gmail addresses via Google Calendar settings — this is a one-time manual step

---

## Out of Scope

- No connection to Airbnb or any external booking platform
- No payment processing
- No SMS or email notifications
- No reporting or analytics dashboard
- No room pricing configuration
- No multi-property support
