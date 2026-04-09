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
 * @returns {{ room, guest, phone, guestCount, rent, payment, notes }}
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
    guest:      map['GUEST']   || '',
    phone:      map['PHONE']   || '',
    guestCount: parseInt(map['GUESTS']) || 1,
    rent:       parseInt(map['RENT'])   || 0,
    payment:    map['PAYMENT'] || 'PENDING',
    notes:      map['NOTES']   || '',
  };
}

/**
 * Formats a booking object into the structured description block.
 * @param {{ room, guest, phone, guestCount, rent, payment, notes }} booking
 * @returns {string}
 */
export function formatDescription(booking) {
  return [
    `ROOM: ${booking.room}`,
    `GUEST: ${booking.guest || ''}`,
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
 * @param {{ start: string, end: string }} event  ISO date strings YYYY-MM-DD
 * @param {Date} [today]
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
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a YYYY-MM-DD date string for human display (e.g. "8 Apr 2026").
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}
