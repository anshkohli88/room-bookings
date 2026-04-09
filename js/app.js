// js/app.js
import { isAuthenticated, getCurrentUser } from './auth.js';
// signOut is called directly by the home screen header — imported there
import { fetchAllEvents } from './api.js';
import { showToast, showLoading, hideLoading } from './ui.js';
import { renderLogin   } from './screens/login.js';
import { renderHome    } from './screens/home.js';
import { renderRoom    } from './screens/room.js';
import { renderBooking } from './screens/booking.js';

// ---- Global app state ----
export const state = {
  user:    null,   // { name, email }
  events:  [],     // Raw Google Calendar event objects
  loading: false,
};

const app = document.getElementById('app');

// ---- Router ----
// Hash format: #home | #room/GF-1 | #booking/new | #booking/new/GF-1 | #booking/edit/<eventId>
function route() {
  const hash = location.hash || '#home';
  const parts = hash.split('/');
  const screen = parts[0];  // e.g. '#home', '#room', '#booking'

  if (!isAuthenticated()) {
    _mount(renderLogin({
      onSignInSuccess: _onAuthSuccess,
      onSignInError:   _onAuthError,
    }));
    return;
  }

  switch (screen) {
    case '#home':
      _mount(renderHome({
        events:        state.events,
        user:          state.user,
        onAddBooking:  () => navigate('#booking/new'),
        onRoomClick:   roomId => navigate(`#room/${roomId}`),
      }));
      break;

    case '#room':
      _mount(renderRoom({
        roomId:        parts[1],
        events:        state.events,
        onBack:        () => navigate('#home'),
        onAddBooking:  roomId => navigate(`#booking/new/${roomId}`),
        onEditBooking: eventId => navigate(`#booking/edit/${eventId}`),
      }));
      break;

    case '#booking': {
      const mode    = parts[1]; // 'new' or 'edit'
      const extra   = parts[2]; // roomId (new) or eventId (edit)
      _mount(renderBooking({
        mode,
        roomId:  mode === 'new'  ? (extra || null) : null,
        eventId: mode === 'edit' ? extra            : null,
        events:  state.events,
        onBack:  () => history.back(),
        onSaved:   _onBookingSaved,
        onDeleted: _onBookingDeleted,
      }));
      break;
    }

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
  } catch {
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
// Screens return HTML strings. Listeners are attached via window.__attachListeners
// which screens set before returning their HTML.
function _mount(html) {
  const loading = document.getElementById('loading');
  app.innerHTML = '';
  if (loading) app.appendChild(loading);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  while (wrapper.firstChild) app.appendChild(wrapper.firstChild);

  // Attach event listeners registered by the screen render function
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
