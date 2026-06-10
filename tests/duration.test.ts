import {
  durationToWidth,
  formatDuration,
  isValidDuration,
  parseDuration,
} from '@/wwob';

describe('isValidDuration', () => {
  it('accepts m:ss and mm:ss with seconds 00–59', () => {
    expect(isValidDuration('5:30')).toBe(true);
    expect(isValidDuration('12:00')).toBe(true);
  });

  it('rejects malformed input', () => {
    expect(isValidDuration('5:3')).toBe(false); // seconds must be two digits
    expect(isValidDuration('5:60')).toBe(false); // seconds out of range
    expect(isValidDuration('abc')).toBe(false);
  });
});

describe('parseDuration', () => {
  it('converts m:ss to total seconds', () => {
    expect(parseDuration('5:30')).toBe(330);
    expect(parseDuration('0:45')).toBe(45);
  });
});

describe('durationToWidth', () => {
  it('renders 100px per minute', () => {
    expect(durationToWidth(parseDuration('5:30'))).toBe(550);
    expect(durationToWidth(parseDuration('1:00'))).toBe(100);
    expect(durationToWidth(parseDuration('0:45'))).toBe(75);
  });
});

describe('formatDuration', () => {
  it('formats seconds as m:ss (inverse of parseDuration)', () => {
    expect(formatDuration(204)).toBe('3:24');
    expect(formatDuration(303)).toBe('5:03');
    expect(formatDuration(1888)).toBe('31:28');
  });
});
