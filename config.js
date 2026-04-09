// config.js
// ⚠️  Fill in YOUR values before running the app
const CONFIG = {
  // From Google Cloud Console → APIs & Services → Credentials
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',

  // From Google Calendar → Settings → your shared calendar → Calendar ID
  CALENDAR_ID: 'YOUR_CALENDAR_ID@group.calendar.google.com',

  // Gmail addresses of the 3 managers — only these can log in
  ALLOWED_EMAILS: [
    'manager1@gmail.com',
    'manager2@gmail.com',
    'manager3@gmail.com',
  ],

  // How far ahead to fetch bookings (in days)
  FETCH_DAYS_AHEAD: 180,
};

export default CONFIG;
