// js/ui.js

/** Shows a brief toast notification at the bottom of the screen. */
export function showToast(message, type = 'success') {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/**
 * Shows a full-screen green flash for 2 seconds.
 * @param {string} message
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
 * @returns {Promise<boolean>}
 */
export function showConfirm(title, body, confirmLabel = 'Delete') {
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
  return (name?.trim()?.[0] || '?').toUpperCase();
}

/** Formats today's date for the header display. */
export function formatHeaderDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
