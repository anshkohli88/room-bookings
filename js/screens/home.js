// js/screens/home.js
import { ROOMS, isOccupiedToday, parseDescription, formatDateDisplay, toDateStr } from '../model.js';
import { avatarInitial, formatHeaderDate } from '../ui.js';
import { signOut } from '../auth.js';
import { navigate } from '../app.js';

/**
 * Builds a Map<roomId, { occupied, guest, checkOut }> from calendar events.
 */
function buildRoomStatus(events) {
  const status = new Map();
  ROOMS.forEach(r => status.set(r.id, { occupied: false, guest: '', checkOut: '' }));

  events.forEach(ev => {
    const start = ev.start?.date;
    const end   = ev.end?.date;
    if (!start || !end) return;
    if (!isOccupiedToday({ start, end })) return;

    const desc   = parseDescription(ev.description || '');
    const roomId = desc.room || (ev.summary || '').split(' · ')[0];
    if (status.has(roomId)) {
      status.set(roomId, {
        occupied: true,
        guest:    desc.guest || ev.summary?.split(' · ')[1] || 'Guest',
        checkOut: end,
      });
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
    // Sign-out: tapping the avatar signs out and returns to login
    document.getElementById('avatar-btn')?.addEventListener('click', () => {
      signOut();
      navigate('#home', true);
    });
  };

  return `
    <div class="app-header">
      <div class="app-header-row">
        <div>
          <div class="app-header-title">Room Bookings</div>
          <div class="app-header-sub">Chandigarh · ${formatHeaderDate()}</div>
        </div>
        <button class="app-header-avatar" id="avatar-btn" title="Sign out">${avatarInitial(user?.name)}</button>
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
