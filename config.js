// config.js
// ⚠️  Fill in YOUR values before running the app
const CONFIG = {
  // From Google Cloud Console → APIs & Services → Credentials
  CLIENT_ID: '644357597182-ks2fs4v6d9p4pbkbi8edpub5ihroet00.apps.googleusercontent.com',

  // From Google Calendar → Settings → your shared calendar → Calendar ID
  CALENDAR_ID: '04632b28febf5f83129a65e1215dd1399dc04a4f8475cec399ee5fae64580a13@group.calendar.google.com',

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
