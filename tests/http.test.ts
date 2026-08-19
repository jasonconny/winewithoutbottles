import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRetry, USER_AGENT } from '../generator/http';

/**
 * These exist because the bug they cover was invisible to every other guard:
 * `--audit` swept all 319 shows, printed every row, and then died on one
 * MusicBrainz lookup while summarising — with MusicBrainz answering curl fine
 * either side of it. Nothing in the suite could have caught that, because the
 * failure is a rejected `fetch`, not a status code, and the retry logic in all
 * three fetchers only ever looked at `res.status`.
 *
 * So the cases below fake the network rather than touching it: the point is to
 * pin the *shape* of the failure, which is reproducible, rather than the
 * outage, which is not.
 */
const ok = (status = 200) => new Response('{}', { status });
const noSleep = async () => {};

afterEach(() => vi.restoreAllMocks());

describe('fetchRetry', () => {
  it('returns the first successful response without retrying', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    const res = await fetchRetry('https://example.test/a', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('sends the User-Agent both services ask for', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    await fetchRetry('https://example.test/a', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });
    expect(fetchImpl.mock.calls[0][1]).toEqual({
      headers: { 'User-Agent': USER_AGENT },
    });
  });

  it('retries a thrown fetch and succeeds — the case that killed the audit', async () => {
    // Node surfaces a dropped socket exactly like this: a TypeError whose
    // `cause` is the socket error. It is never a status code.
    const dropped = new TypeError('fetch failed', {
      cause: new Error('other side closed'),
    });
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(dropped)
      .mockResolvedValue(ok());
    const res = await fetchRetry('https://example.test/a', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('gives up after the configured retries, keeping the cause', async () => {
    const dropped = new TypeError('fetch failed');
    const fetchImpl = vi.fn().mockRejectedValue(dropped);
    await expect(
      fetchRetry('https://example.test/a', {
        retries: 2,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleep: noSleep,
      }),
    ).rejects.toMatchObject({ cause: dropped });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('retries 429 and 5xx by default', async () => {
    for (const status of [429, 500, 503]) {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(ok(status))
        .mockResolvedValue(ok());
      const res = await fetchRetry('https://example.test/a', {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleep: noSleep,
      });
      expect(res.status, `status ${status}`).toBe(200);
      expect(fetchImpl, `status ${status}`).toHaveBeenCalledTimes(2);
    }
  });

  it('does NOT retry a 404, and hands it back for the caller to judge', async () => {
    // Retrying a 404 would turn "this release has no article" into five
    // pointless requests and a much slower, no-more-correct run.
    const fetchImpl = vi.fn().mockResolvedValue(ok(404));
    const res = await fetchRetry('https://example.test/a', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });
    expect(res.status).toBe(404);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('honours a caller-supplied retryStatus — MusicBrainz means "wait" by 503', async () => {
    // MusicBrainz's 503 is rate limiting, not an outage; its 500 is not, and
    // retrying that would just hammer a broken endpoint.
    const retryStatus = (status: number) => status === 503 || status === 429;
    const fetchImpl = vi.fn().mockResolvedValue(ok(500));
    const res = await fetchRetry('https://example.test/a', {
      retryStatus,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });
    expect(res.status).toBe(500);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns the response rather than throwing when retries run out on a status', async () => {
    // The caller's own `res.ok` check produces a better message than ours, so a
    // retryable status that never clears is still handed back.
    const fetchImpl = vi.fn().mockResolvedValue(ok(503));
    const res = await fetchRetry('https://example.test/a', {
      retries: 1,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: noSleep,
    });
    expect(res.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('backs off exponentially from the given base', async () => {
    const waits: number[] = [];
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue(ok());
    await fetchRetry('https://example.test/a', {
      baseDelayMs: 100,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: async (ms) => {
        waits.push(ms);
      },
    });
    expect(waits).toEqual([100, 200, 400]);
  });
});
