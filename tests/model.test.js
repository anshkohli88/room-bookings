// tests/model.test.js
import { parseDescription, formatDescription, isOccupiedToday, toDateStr, formatDateDisplay, getRoomById, ROOMS } from '../js/model.js';

describe('ROOMS', () => {
  test('has 6 rooms', () => {
    expect(ROOMS).toHaveLength(6);
  });
  test('room IDs are correct', () => {
    const ids = ROOMS.map(r => r.id);
    expect(ids).toEqual(['GF-1','GF-2','GF-3','GF-4','FF-1','FF-2']);
  });
});

describe('getRoomById', () => {
  test('finds existing room', () => expect(getRoomById('GF-1').id).toBe('GF-1'));
  test('returns undefined for unknown', () => expect(getRoomById('XX-9')).toBeUndefined());
});

describe('parseDescription', () => {
  const desc = `ROOM: GF-1\nGUEST: Raj Sharma\nPHONE: +91 98765 43210\nGUESTS: 2\nRENT: 12000\nPAYMENT: PAID\nNOTES: Late checkout`;

  test('parses room',    () => expect(parseDescription(desc).room).toBe('GF-1'));
  test('parses guest',   () => expect(parseDescription(desc).guest).toBe('Raj Sharma'));
  test('parses phone',   () => expect(parseDescription(desc).phone).toBe('+91 98765 43210'));
  test('parses guests',  () => expect(parseDescription(desc).guestCount).toBe(2));
  test('parses rent',    () => expect(parseDescription(desc).rent).toBe(12000));
  test('parses payment', () => expect(parseDescription(desc).payment).toBe('PAID'));
  test('parses notes',   () => expect(parseDescription(desc).notes).toBe('Late checkout'));
  test('handles empty notes', () => {
    expect(parseDescription('ROOM: FF-1\nGUEST: A\nPHONE: \nGUESTS: 1\nRENT: 0\nPAYMENT: PENDING\nNOTES: ').notes).toBe('');
  });
  test('handles missing keys gracefully', () => {
    const result = parseDescription('ROOM: GF-2');
    expect(result.guest).toBe('');
    expect(result.phone).toBe('');
    expect(result.guestCount).toBe(1);
    expect(result.payment).toBe('PENDING');
  });
});

describe('formatDescription', () => {
  test('round-trips through parse', () => {
    const booking = { room:'GF-1', guest:'Test User', phone:'+91 111', guestCount:3, rent:5000, payment:'PENDING', notes:'test' };
    const parsed = parseDescription(formatDescription(booking));
    expect(parsed.room).toBe('GF-1');
    expect(parsed.guest).toBe('Test User');
    expect(parsed.guestCount).toBe(3);
    expect(parsed.payment).toBe('PENDING');
    expect(parsed.notes).toBe('test');
  });
});

describe('isOccupiedToday', () => {
  const today = new Date('2026-04-08');
  test('event spanning today returns true',           () => expect(isOccupiedToday({ start:'2026-04-05', end:'2026-04-12' }, today)).toBe(true));
  test('checkout day is free (end === today)',         () => expect(isOccupiedToday({ start:'2026-04-05', end:'2026-04-08' }, today)).toBe(false));
  test('future event returns false',                  () => expect(isOccupiedToday({ start:'2026-04-10', end:'2026-04-15' }, today)).toBe(false));
  test('past event returns false',                    () => expect(isOccupiedToday({ start:'2026-04-01', end:'2026-04-05' }, today)).toBe(false));
  test('defaults to real today when no arg passed',   () => {
    const futureEvent = { start:'2099-01-01', end:'2099-12-31' };
    expect(isOccupiedToday(futureEvent)).toBe(false);
  });
});

describe('toDateStr', () => {
  test('formats date as YYYY-MM-DD', () => {
    expect(toDateStr(new Date('2026-04-08'))).toBe('2026-04-08');
  });
});

describe('formatDateDisplay', () => {
  test('formats YYYY-MM-DD for display', () => {
    expect(formatDateDisplay('2026-04-08')).toBe('8 Apr 2026');
  });
  test('handles empty string', () => {
    expect(formatDateDisplay('')).toBe('');
  });
});
