// js/auth.js
import CONFIG from '../config.js';

let _tokenClient = null;
let _accessToken = sessionStorage.getItem('gToken') || null;
let _tokenExpiry = parseInt(sessionStorage.getItem('gTokenExpiry') || '0');
let _currentUser = JSON.parse(sessionStorage.getItem('gUser') || 'null');
let _pendingUser = null;
let _authCallbacks = { onSuccess: null, onError: null };

/** Checks if an email is in the allowed list (case-insensitive). */
export function isEmailAllowed(email, allowedList) {
  if (!email) return false;
  return allowedList.some(e => e.toLowerCase() === email.toLowerCase());
}

/** Returns true if we have a valid, non-expired access token. */
export function isAuthenticated() {
  return !!_accessToken && Date.now() < _tokenExpiry && !!_currentUser;
}

/** Returns the cached user object { name, email } or null. */
export function getCurrentUser() {
  return _currentUser;
}

/** Returns the access token string for API calls. */
export function getAccessToken() {
  return _accessToken;
}

/**
 * Initialises Google Identity and the Calendar token client.
 * Must be called after the GSI script has loaded.
 */
export function initAuth(onSuccess, onError) {
  if (typeof google === 'undefined') {
    onError('Google Sign-In failed to load. Please refresh the page.');
    return;
  }

  _authCallbacks = { onSuccess, onError };

  google.accounts.id.initialize({
    client_id: CONFIG.CLIENT_ID,
    callback: _handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  _tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar',
    callback: _handleTokenResponse,
  });
}

/** Triggers the Google Sign-In flow, then requests Calendar access. */
export function signIn() {
  if (!_tokenClient || typeof google === 'undefined') {
    throw new Error('Auth not initialised. Call initAuth first.');
  }

  google.accounts.id.prompt(notification => {
    if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
      _authCallbacks.onError?.('Google Sign-In popup could not be shown. Please disable popup blockers and try again.');
    }
  });
}

/** Clears the session and signs the user out. */
export function signOut() {
  if (_accessToken && typeof google !== 'undefined') {
    google.accounts.oauth2.revoke(_accessToken);
  }
  _accessToken = null;
  _tokenExpiry = 0;
  _currentUser = null;
  _pendingUser = null;
  sessionStorage.removeItem('gToken');
  sessionStorage.removeItem('gTokenExpiry');
  sessionStorage.removeItem('gUser');
}

// ---- Private ----

function _handleCredentialResponse(resp) {
  const { onError } = _authCallbacks;

  try {
    const user = _parseJwt(resp.credential);
    const email = user?.email || '';

    if (!isEmailAllowed(email, CONFIG.ALLOWED_EMAILS)) {
      _pendingUser = null;
      onError?.('Access not authorised. Please contact the property manager.');
      return;
    }

    _pendingUser = {
      name: user?.name || email,
      email,
    };

    _tokenClient.requestAccessToken({ prompt: '' });
  } catch {
    _pendingUser = null;
    onError?.('Could not verify your Google account. Please try again.');
  }
}

function _handleTokenResponse(resp) {
  const { onSuccess, onError } = _authCallbacks;

  if (resp.error) {
    _pendingUser = null;
    onError?.('Sign-in was cancelled or failed. Please try again.');
    return;
  }

  if (!_pendingUser) {
    _accessToken = null;
    _tokenExpiry = 0;
    onError?.('Could not verify your account. Please try again.');
    return;
  }

  _accessToken = resp.access_token;
  _tokenExpiry = Date.now() + (resp.expires_in * 1000);
  _currentUser = _pendingUser;
  _pendingUser = null;

  sessionStorage.setItem('gToken', _accessToken);
  sessionStorage.setItem('gTokenExpiry', String(_tokenExpiry));
  sessionStorage.setItem('gUser', JSON.stringify(_currentUser));
  onSuccess?.(_currentUser);
}

function _parseJwt(token) {
  if (!token) throw new Error('Missing credential');
  const base64 = token.split('.')[1];
  if (!base64) throw new Error('Invalid credential');

  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
  const json = atob(padded);
  return JSON.parse(json);
}
