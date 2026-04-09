// tests/auth.test.js
import { isEmailAllowed } from '../js/auth.js';

const ALLOWED = ['a@gmail.com', 'b@gmail.com', 'c@gmail.com'];

describe('isEmailAllowed', () => {
  test('allowed email returns true',   () => expect(isEmailAllowed('a@gmail.com', ALLOWED)).toBe(true));
  test('unknown email returns false',  () => expect(isEmailAllowed('hacker@evil.com', ALLOWED)).toBe(false));
  test('empty email returns false',    () => expect(isEmailAllowed('', ALLOWED)).toBe(false));
  test('case-insensitive match',       () => expect(isEmailAllowed('A@GMAIL.COM', ALLOWED)).toBe(true));
  test('null email returns false',     () => expect(isEmailAllowed(null, ALLOWED)).toBe(false));
});
