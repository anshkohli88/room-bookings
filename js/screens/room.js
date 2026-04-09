// js/screens/room.js
import { parseDescription, formatDateDisplay } from '../model.js';

/**
 * Filters and sorts events for a specific room by check-in date.
 */
function getRoomBookings(events, roomId) {
  return events
    .filter(ev => {
      const desc   = parseDescription(ev.description || '');
      const evRoom = desc.room || (ev.summary || '').split(' · ')[0];
      return evRoom === roomId;
    })
    .sort((a, b) => (a.start?.date || '').localeCompare(b.start?.date || ''));
}

export function renderRoom({ roomId, events, onBack, onAddBooking, onEditBooking }) {
  const bookings = getRoomBookings(events, roomId);

  const bookingItems = bookings.length === 0
    ? `<div class="empty-state">No bookings for ${roomId}.<br>Tap the button below to add one.</div>`
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
          <div class="app-header-sub">All Bookings</div>
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
