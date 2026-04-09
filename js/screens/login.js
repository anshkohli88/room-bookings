// js/screens/login.js
import { initAuth, renderGoogleButton } from '../auth.js';

let _authReady = false;

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
        const btnHost = document.getElementById('google-signin-host');
        if (btnHost) {
          btnHost.innerHTML = '';
          renderGoogleButton(btnHost);
        }
        _authReady = true;
      } else {
        setTimeout(tryInit, 200);
      }
    }
    tryInit();

  };

  return `
    <div class="login-screen">
      <div class="login-logo">🏠</div>
      <div class="login-title">Room Bookings</div>
      <div class="login-sub">Chandigarh, India · 6 Rooms</div>
      <div class="google-signin-host" id="google-signin-host"></div>
      <div class="login-error" id="login-error"></div>
    </div>
  `;
}
