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
 * Fetches all booking events from the shared calendar.
 * Looks back 30 days and ahead FETCH_DAYS_AHEAD days.
 */
export async function fetchAllEvents() {
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 30);

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
 * @returns {object} Created event.
 */
export async function createEvent(booking) {
  const room = getRoomById(booking.room);
  const body = {
    summary:     `${booking.room} · ${booking.guest}`,
    description: formatDescription(booking),
    colorId:     room?.calColor || '1',
    start:       { date: booking.checkIn  },
    end:         { date: booking.checkOut },
  };
  return apiFetch(`/calendars/${CAL}/events`, { method: 'POST', body: JSON.stringify(body) });
}

/**
 * Updates an existing booking event.
 * @param {string} eventId
 * @param {{ room, guest, phone, guestCount, rent, payment, notes, checkIn, checkOut }} booking
 * @returns {object} Updated event.
 */
export async function updateEvent(eventId, booking) {
  const room = getRoomById(booking.room);
  const body = {
    summary:     `${booking.room} · ${booking.guest}`,
    description: formatDescription(booking),
    colorId:     room?.calColor || '1',
    start:       { date: booking.checkIn  },
    end:         { date: booking.checkOut },
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
