// js/screens/booking.js
import { ROOMS, parseDescription, formatDateDisplay, toDateStr } from '../model.js';
import { createEvent, updateEvent, deleteEvent } from '../api.js';
import { showSuccessFlash, showToast, showConfirm, esc } from '../ui.js';

// ---- Module-level state (reset on each renderBooking call) ----
let _picker = {
  viewYear:     0,
  viewMonth:    0,
  checkIn:      null,  // YYYY-MM-DD
  checkOut:     null,
  step:         0,     // 0=picking check-in, 1=picking check-out, 2=done
  bookedRanges: [],    // [{ start, end }] for current room, excluding edited event
};

let _form = {
  room: '', guest: '', phone: '', guestCount: 1,
  rent: '', payment: 'PAID', notes: '',
};

let _eventId   = null;
let _callbacks = {};
let _allEvents = [];

// ----

export function renderBooking({ mode, roomId, eventId, events, onBack, onSaved, onDeleted }) {
  _allEvents  = events;
  _callbacks  = { onBack, onSaved, onDeleted };
  _eventId    = eventId || null;

  const today = new Date();
  _picker.viewYear  = today.getFullYear();
  _picker.viewMonth = today.getMonth();

  if (mode === 'edit' && eventId) {
    const ev   = events.find(e => e.id === eventId) || {};
    const desc = parseDescription(ev.description || '');
    _form = {
      room:       desc.room || (ev.summary || '').split(' · ')[0] || ROOMS[0].id,
      guest:      desc.guest      || '',
      phone:      desc.phone      || '',
      guestCount: desc.guestCount || 1,
      rent:       String(desc.rent || ''),
      payment:    desc.payment    || 'PAID',
      notes:      desc.notes      || '',
    };
    _picker.checkIn  = ev.start?.date || null;
    _picker.checkOut = ev.end?.date   || null;
    _picker.step     = (_picker.checkIn && _picker.checkOut) ? 2 : 0;
  } else {
    _form = {
      room: roomId || ROOMS[0].id, guest: '', phone: '',
      guestCount: 1, rent: '', payment: 'PAID', notes: '',
    };
    _picker.checkIn  = null;
    _picker.checkOut = null;
    _picker.step     = 0;
  }

  _updateBookedRanges();
  window.__attachListeners = _attachListeners;

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
      <div class="header-room-chip" id="header-room-chip">Room ${esc(_form.room)}</div>
    </div>
    <div class="screen-body">

      <div class="field-group">
        <label class="field-label" for="f-room">Room</label>
        <select class="field-input" id="f-room" ${roomLocked ? 'disabled' : ''}>
          ${ROOMS.map(r => `<option value="${esc(r.id)}" ${r.id === _form.room ? 'selected' : ''}>${esc(r.id)} — ${esc(r.floor)}</option>`).join('')}
        </select>
      </div>

      <div class="field-group">
        <label class="field-label" for="f-guest">Guest Name</label>
        <input class="field-input" id="f-guest" type="text" placeholder="e.g. Raj Sharma"
          value="${esc(_form.guest)}" autocomplete="off">
      </div>

      <div class="field-group">
        <label class="field-label" for="f-phone">Phone Number</label>
        <input class="field-input" id="f-phone" type="tel" placeholder="+91 98765 43210"
          value="${esc(_form.phone)}">
      </div>

      <div class="field-group">
        <label class="field-label">Check-in → Check-out</label>
        <p class="cal-instruction" id="cal-instruction">${_getInstruction()}</p>
        <div class="date-chips">
          <div class="date-chip ${_picker.step === 0 ? 'active' : ''}">
            <div class="date-chip-label">Check-in</div>
            <div class="date-chip-value ${!_picker.checkIn ? 'placeholder' : ''}" id="chip-checkin">
              ${_picker.checkIn ? formatDateDisplay(_picker.checkIn) : 'Select date'}
            </div>
          </div>
          <div class="date-chip ${_picker.step === 1 ? 'active' : ''}">
            <div class="date-chip-label">Check-out</div>
            <div class="date-chip-value ${!_picker.checkOut ? 'placeholder' : ''}" id="chip-checkout">
              ${_picker.checkOut ? formatDateDisplay(_picker.checkOut) : 'Select date'}
            </div>
          </div>
        </div>
        <div class="mini-cal" id="mini-cal">${_renderCal()}</div>
      </div>

      <div class="field-group">
        <label class="field-label" for="f-guests">Number of Guests</label>
        <input class="field-input" id="f-guests" type="number" min="1" max="20"
          value="${_form.guestCount}" placeholder="1">
      </div>

      <div class="field-group">
        <label class="field-label" for="f-rent">Rent Amount (₹)</label>
        <input class="field-input" id="f-rent" type="number" min="0"
          placeholder="e.g. 12000" value="${esc(_form.rent)}">
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
        <textarea class="field-input" id="f-notes"
          placeholder="Any extra details...">${esc(_form.notes)}</textarea>
      </div>

      <button class="btn-primary" id="save-btn">Save Booking to Calendar</button>
      ${isEdit ? `<button class="btn-danger" id="delete-btn">Delete Booking</button>` : ''}

    </div>
  `;
}

// ---- Calendar rendering ----

function _renderCal() {
  const { viewYear: y, viewMonth: m } = _picker;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const firstWeekday = new Date(y, m, 1).getDay();
  const daysInMonth  = new Date(y, m + 1, 0).getDate();
  const todayStr     = toDateStr(new Date());

  let cells = '';
  for (let i = 0; i < firstWeekday; i++) cells += `<div class="cal-day"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells += `<div class="cal-day ${_dayClass(dateStr, todayStr)}" data-date="${dateStr}">${d}</div>`;
  }

  return `
    <div class="cal-header">
      <button class="cal-nav" id="cal-prev" type="button">‹</button>
      <span>${MONTHS[m]} ${y}</span>
      <button class="cal-nav" id="cal-next" type="button">›</button>
    </div>
    <div class="cal-grid">
      <div class="cal-weekdays"><div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div></div>
      <div class="cal-days" id="cal-days">${cells}</div>
    </div>
  `;
}

function _dayClass(dateStr, todayStr) {
  const { checkIn, checkOut, bookedRanges } = _picker;
  const cls = [];
  if (dateStr < todayStr)  cls.push('past');
  if (dateStr === todayStr) cls.push('today');
  if (_isBooked(dateStr, bookedRanges)) cls.push('booked');
  if (checkIn  && dateStr === checkIn)  cls.push('check-in');
  if (checkOut && dateStr === checkOut) cls.push('check-out');
  if (checkIn && checkOut && dateStr > checkIn && dateStr < checkOut) cls.push('in-range');
  return cls.join(' ');
}

function _isBooked(dateStr, ranges) {
  return ranges.some(r => dateStr >= r.start && dateStr < r.end);
}

function _getInstruction() {
  if (_picker.step === 0) return 'Tap a date to set Check-in';
  if (_picker.step === 1) return 'Now tap a date to set Check-out';
  return 'Tap a date above to change dates';
}

// ---- Event listeners ----

function _attachListeners() {
  document.getElementById('back-btn')?.addEventListener('click', _callbacks.onBack);

  // Room selector
  document.getElementById('f-room')?.addEventListener('change', e => {
    _form.room = e.target.value;
    document.getElementById('header-room-chip').textContent = `Room ${_form.room}`;
    _updateBookedRanges();
    _picker.checkIn  = null;
    _picker.checkOut = null;
    _picker.step     = 0;
    _refreshCal();
    _refreshChips();
  });

  // Calendar (event delegation on the container)
  document.getElementById('mini-cal')?.addEventListener('click', e => {
    const id = e.target.id || e.target.closest('[id]')?.id;
    if (e.target.id === 'cal-prev' || e.target.closest('#cal-prev')) {
      _picker.viewMonth--;
      if (_picker.viewMonth < 0) { _picker.viewMonth = 11; _picker.viewYear--; }
      _refreshCal();
    } else if (e.target.id === 'cal-next' || e.target.closest('#cal-next')) {
      _picker.viewMonth++;
      if (_picker.viewMonth > 11) { _picker.viewMonth = 0; _picker.viewYear++; }
      _refreshCal();
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

  document.getElementById('save-btn')?.addEventListener('click', _onSave);
  document.getElementById('delete-btn')?.addEventListener('click', _onDelete);
}

function _onDayClick(dateStr, el) {
  if (el.classList.contains('past') || el.classList.contains('booked') || !dateStr) return;

  if (_picker.step === 0 || _picker.step === 2) {
    // Start new selection
    _picker.checkIn  = dateStr;
    _picker.checkOut = null;
    _picker.step     = 1;
  } else {
    // Completing the range
    if (dateStr <= _picker.checkIn) {
      // Treat as new check-in
      _picker.checkIn  = dateStr;
      _picker.checkOut = null;
      _picker.step     = 1;
    } else if (_rangeOverlapsBooked(_picker.checkIn, dateStr)) {
      showToast('Those dates overlap an existing booking for this room.', 'error');
    } else {
      _picker.checkOut = dateStr;
      _picker.step     = 2;
    }
  }
  _refreshCal();
  _refreshChips();
}

function _rangeOverlapsBooked(start, end) {
  return _picker.bookedRanges.some(r => r.start < end && r.end > start);
}

function _refreshCal() {
  const calEl = document.getElementById('mini-cal');
  if (calEl) calEl.innerHTML = _renderCal();
  const instrEl = document.getElementById('cal-instruction');
  if (instrEl) instrEl.textContent = _getInstruction();
}

function _refreshChips() {
  const ci = document.getElementById('chip-checkin');
  const co = document.getElementById('chip-checkout');
  if (ci) {
    ci.textContent = _picker.checkIn ? formatDateDisplay(_picker.checkIn) : 'Select date';
    ci.classList.toggle('placeholder', !_picker.checkIn);
  }
  if (co) {
    co.textContent = _picker.checkOut ? formatDateDisplay(_picker.checkOut) : 'Select date';
    co.classList.toggle('placeholder', !_picker.checkOut);
  }
}

function _updateBookedRanges() {
  _picker.bookedRanges = _allEvents
    .filter(ev => {
      const desc   = parseDescription(ev.description || '');
      const evRoom = desc.room || (ev.summary || '').split(' · ')[0];
      return evRoom === _form.room && ev.id !== _eventId;
    })
    .map(ev => ({ start: ev.start?.date, end: ev.end?.date }))
    .filter(r => r.start && r.end);
}

// ---- Save & Delete ----

async function _onSave() {
  // Read current form values
  _form.guest      = document.getElementById('f-guest')?.value.trim()  || '';
  _form.phone      = document.getElementById('f-phone')?.value.trim()  || '';
  _form.guestCount = parseInt(document.getElementById('f-guests')?.value) || 1;
  _form.rent       = document.getElementById('f-rent')?.value.trim()   || '0';
  _form.notes      = document.getElementById('f-notes')?.value.trim()  || '';

  // Validation
  if (!_form.guest)           { showToast('Please enter the guest name.', 'error');   return; }
  if (!_picker.checkIn)       { showToast('Please select a check-in date.', 'error'); return; }
  if (!_picker.checkOut)      { showToast('Please select a check-out date.', 'error'); return; }

  const booking = {
    room:       _form.room,
    guest:      _form.guest,
    phone:      _form.phone,
    guestCount: _form.guestCount,
    rent:       parseInt(_form.rent) || 0,
    payment:    _form.payment,
    notes:      _form.notes,
    checkIn:    _picker.checkIn,
    checkOut:   _picker.checkOut,
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
    showToast(`Could not save booking. ${err.message || 'Please check your internet connection.'}`, 'error');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Booking to Calendar'; }
  }
}

async function _onDelete() {
  const ok = await showConfirm(
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
    showToast(`Could not delete booking. ${err.message || 'Please check your internet connection.'}`, 'error');
  }
}
