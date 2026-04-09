// js/screens/login.js
import { initAuth, signIn } from '../auth.js';

/**
 * Returns HTML for the login screen.
 * Sets window.__attachListeners for DOM event wiring after mount.
 */
export function renderLogin({ onSignInSuccess, onSignInError }) {
  window.__attachListeners = () => {
    // Wait for GIS library to load before initialising
    function tryInit() {
      if (typeof google !== 'undefined' && google.accounts) {
        initAuth(onSignInSuccess, onSignInError);
      } else {
        setTimeout(tryInit, 200);
      }
    }
    tryInit();

    document.getElementById('sign-in-btn')?.addEventListener('click', () => {
      const errEl = document.getElementById('login-error');
      if (errEl) errEl.textContent = '';
      try {
        signIn();
      } catch {
        if (errEl) errEl.textContent = 'Sign-in is not ready yet. Please wait a moment and try again.';
      }
    });
  };

  return `
    <div class="login-screen">
      <div class="login-logo">🏠</div>
      <div class="login-title">Room Bookings</div>
      <div class="login-sub">Chandigarh, India · 6 Rooms</div>
      <button class="login-btn" id="sign-in-btn">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="24" height="24">
        Sign in with Google
      </button>
      <div class="login-error" id="login-error"></div>
    </div>
  `;
}
