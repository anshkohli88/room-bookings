// config.js
// ⚠️  Fill in YOUR values before running the app
const CONFIG = {
  // From Google Cloud Console → APIs & Services → Credentials
  CLIENT_ID: '597616176875-47c0l0r74br63div0rauj3q46ggqphgf.apps.googleusercontent.com',

  // From Google Calendar → Settings → your shared calendar → Calendar ID
  CALENDAR_ID: 'anshkohli019@gmail.com',

  // Gmail addresses of the 3 managers — only these can log in
  ALLOWED_EMAILS: [
    'surinderkohli88@gmail.com',
    'amitkohli18@gmail.com',
    'anshkohli019@gmail.com',
  ],

  // How far ahead to fetch bookings (in days)
  FETCH_DAYS_AHEAD: 180,
};

export default CONFIG;
