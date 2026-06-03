import { cleanTitle, titleToRgb } from '@/wwob';

describe('cleanTitle', () => {
  it('uppercases, turns spaces into underscores, strips non-letters', () => {
    expect(cleanTitle('U.S. Blues')).toBe('US_BLUES');
    expect(cleanTitle('dark star')).toBe('DARK_STAR');
  });
});

describe('titleToRgb', () => {
  it('averages contiguous thirds (len % 3 === 0)', () => {
    // DARK_STAR -> DAR | K_S | TAR
    expect(titleToRgb('Dark Star')).toEqual({ r: 77, g: 100, b: 130 });
  });

  it('gives the extra char to the middle slice (len % 3 === 1)', () => {
    // ABCD -> A | BC | D
    expect(titleToRgb('ABCD')).toEqual({ r: 10, g: 25, b: 40 });
  });

  it('gives extra chars to the outer slices (len % 3 === 2)', () => {
    // ABCDE -> AB | C | DE
    expect(titleToRgb('ABCDE')).toEqual({ r: 15, g: 30, b: 45 });
  });

  it('caps Z at 255 and treats empty slices as 0', () => {
    // Z -> "" | Z | ""
    expect(titleToRgb('Z')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('treats underscores (spaces) as 0', () => {
    // A_A -> A | _ | A
    expect(titleToRgb('A A')).toEqual({ r: 10, g: 0, b: 10 });
  });

  it('returns black when nothing survives cleaning', () => {
    expect(titleToRgb('123!')).toEqual({ r: 0, g: 0, b: 0 });
  });
});
