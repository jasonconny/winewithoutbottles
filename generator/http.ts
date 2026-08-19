/**
 * One HTTP GET, retried — the single place the generator talks to the network.
 *
 * Every fetch in this directory used to handle failure on its own, and all
 * three handled the same half of it: they checked `res.status` and ignored the
 * possibility that `fetch` itself throws. It does, routinely — a dropped
 * connection surfaces as `TypeError: fetch failed` wrapping `ECONNRESET` or
 * `SocketError: other side closed`, never as a status code, so no amount of
 * 503-handling catches it.
 *
 * That gap took down a whole `--audit` run: the sweep read all 319 shows, then
 * died on a single MusicBrainz lookup while summarising, and MusicBrainz was
 * answering curl fine either side of it. A transient blip on one request should
 * cost that request, not the run.
 *
 * So retries here cover **both** failure modes, and the caller says which
 * statuses are worth retrying (MusicBrainz means "slow down" by 503; a 404 from
 * anywhere means stop).
 */

/** Sent on every request; MusicBrainz and archive.org both ask for one. */
export const USER_AGENT =
  'wine-without-bottles/1.0 (https://winewithoutbottles.com)';

export interface FetchRetryOptions {
  /** Attempts after the first. */
  retries?: number;
  /** First backoff, doubled each attempt. */
  baseDelayMs?: number;
  /** Which HTTP statuses are worth retrying. Default: 429 and any 5xx. */
  retryStatus?: (status: number) => boolean;
  /** Prefix for the "retrying" line, so output says which service is slow. */
  label?: string;
  /** Injectable for tests, which must not actually wait. */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const retryableByDefault = (status: number) => status === 429 || status >= 500;

/**
 * GET `url`, retrying transport failures and retryable statuses alike.
 *
 * Resolves with the `Response` for any status the caller does not want retried
 * — including 404 — so callers keep their own "is this OK?" logic. Rejects only
 * when the retries are exhausted, and then with the underlying cause attached
 * so the message still says what actually broke.
 */
export async function fetchRetry(
  url: string,
  options: FetchRetryOptions = {},
): Promise<Response> {
  const {
    retries = 4,
    baseDelayMs = 500,
    retryStatus = retryableByDefault,
    label = 'request',
    sleep = defaultSleep,
    fetchImpl = fetch,
  } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const backoff = baseDelayMs * 2 ** (attempt - 1);
      // Labels carry the full request path so a thrown error names what broke,
      // but a MusicBrainz query string is 200 characters of URL-encoding and
      // this line can print several times per run. Trim it for the console.
      const short = label.length > 60 ? `${label.slice(0, 57)}…` : label;
      console.log(`  ${short} retry ${attempt}/${retries} in ${backoff}ms`);
      await sleep(backoff);
    }
    try {
      const res = await fetchImpl(url, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!retryStatus(res.status)) return res;
      lastError = new Error(`${label}: HTTP ${res.status}`);
      // A retryable status on the final attempt is still a real response, and
      // the caller's own status check gives a better message than ours.
      if (attempt === retries) return res;
    } catch (error) {
      // `fetch` rejects for DNS, TLS and socket failures. These are exactly the
      // ones worth retrying, and exactly the ones nothing here used to catch.
      lastError = error;
      if (attempt === retries) break;
    }
  }
  throw new Error(`${label}: giving up after ${retries + 1} attempts`, {
    cause: lastError,
  });
}
