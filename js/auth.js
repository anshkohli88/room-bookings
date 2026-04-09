// js/auth.js
import CONFIG from '../config.js';

const _storage = typeof sessionStorage !== 'undefined' ? sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

let _tokenClient = null;
let _accessToken = _storage.getItem('gToken') || null;
let _tokenExpiry  = parseInt(_storage.getItem('gTokenExpiry') || '0');
let _currentUser  = JSON.parse(_storage.getItem('gUser') || 'null');

/** Checks if an email is in the allowed list (case-insensitive). */
export function isEmailAllowed(email, allowedList) {
  if (!email) return false;
  return allowedList.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

/** Returns true if we have a valid, non-expired access token. */
export function isAuthenticated() {
  return !!_accessToken && Date.now() < _tokenExpiry;
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
 * Initialises the Google Identity Services token client.
 * Must be called after the GSI script has loaded.
 */
export function initAuth(onSuccess, onError) {
  if (typeof google === 'undefined') {
    onError('Google Sign-In failed to load. Please refresh the page.');
    return;
  }
  _tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar',
    callback: (resp) => _handleTokenResponse(resp, onSuccess, onError),
  });
}

/** Triggers the Google Sign-In popup / one-tap flow. */
export function signIn() {
  if (!_tokenClient) throw new Error('Auth not initialised — call initAuth first.');
  _tokenClient.requestAccessToken({ prompt: '' });
}

/** Clears the session and signs the user out. */
export function signOut() {
  if (_accessToken && typeof google !== 'undefined') {
    google.accounts.oauth2.revoke(_accessToken);
  }
  _accessToken = null;
  _tokenExpiry = 0;
  _currentUser = null;
  _storage.removeItem('gToken');
  _storage.removeItem('gTokenExpiry');
  _storage.removeItem('gUser');
}

// ---- Private ----

async function _handleTokenResponse(resp, onSuccess, onError) {
  if (resp.error) {
    onError('Sign-in was cancelled or failed. Please try again.');
    return;
  }
  _accessToken = resp.access_token;
  _tokenExpiry = Date.now() + (resp.expires_in * 1000);
  _storage.setItem('gToken', _accessToken);
  _storage.setItem('gTokenExpiry', String(_tokenExpiry));

  try {
    const userResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${_accessToken}` },
    });
    const user = await userResp.json();

    if (!isEmailAllowed(user.email, CONFIG.ALLOWED_EMAILS)) {
      signOut();
      onError('Access not authorised. Please contact the property manager.');
      return;
    }

    _currentUser = { name: user.name, email: user.email };
    _storage.setItem('gUser', JSON.stringify(_currentUser));
    onSuccess(_currentUser);
  } catch {
    signOut();
    onError('Could not verify your account. Please check your internet connection.');
  }
}
