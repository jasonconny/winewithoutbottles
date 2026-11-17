import { describe, expect, it } from 'vitest';
import { ownReleaseWikitext } from '../generator/wiki';

/**
 * The shape is copied from the Road Trips Volume 2 Number 2 article as it stood
 * in November 2026, after Wikipedia added the Record Store Day reissue as a
 * section of it — which is what made the importer read 29 tracks for 2/14/68.
 */
const original = [
  '{{Infobox album',
  '| name = Road Trips Volume 2 Number 2',
  '| released = 2009',
  '}}',
  '==Track listing==',
  '# "Morning Dew" (Dobson, Rose) – 6:30',
  '# "In the Midnight Hour" (Pickett, Cropper) – 10:35',
  '',
].join('\n');
const reissue = [
  '==Record Store Day release==',
  '{{Infobox album',
  '| name = Carousel Ballroom, San Francisco, CA, 2/14/68',
  '| released = November 27, 2026',
  '}}',
  'On November 27, 2026, the same concert …',
  '',
  '===LP track listing===',
  '# "Morning Dew" (Dobson, Rose)',
  '',
].join('\n');

describe('ownReleaseWikitext', () => {
  it('leaves an article with one infobox untouched', () => {
    expect(ownReleaseWikitext(original)).toBe(original);
  });

  it('cuts from the heading that introduces a second release', () => {
    expect(ownReleaseWikitext(original + reissue)).toBe(original);
  });

  it('cuts at the infobox when prose separates it from the heading', () => {
    const prose = '==Reissue==\nSome words first.\n{{Infobox album\n}}\n';
    expect(ownReleaseWikitext(original + prose)).toBe(
      original + '==Reissue==\nSome words first.\n',
    );
  });

  it('does not reach back to an earlier heading', () => {
    // The track-listing heading sits above real tracks; only a heading with
    // nothing but whitespace before the infobox is the reissue's own.
    const out = ownReleaseWikitext(original + '{{infobox Album\n}}\n');
    expect(out).toContain('In the Midnight Hour');
    expect(out).toBe(original);
  });
});
