import { isKnownPath } from './routes.ts';

interface Env {
  ASSETS: Fetcher;
}

/**
 * Gives unknown paths a real 404 status.
 *
 * `not_found_handling = "single-page-application"` answers every unmatched path
 * with index.html and a 200, so the client-rendered NotFound page reads as a
 * successful page to crawlers. This Worker keeps that body — the SPA still
 * renders NotFound exactly as before — and only corrects the status line.
 *
 * Navigation requests would normally bypass the Worker entirely (Cloudflare
 * short-circuits `Sec-Fetch-Mode: navigate` straight to the SPA fallback), so
 * wrangler.toml opts them back in via `run_worker_first`, while excluding the
 * hashed bundles and per-show files so real assets never pay for this.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const assetResponse = await env.ASSETS.fetch(request);

    // Only the SPA shell is a candidate for rewriting. Anything else that
    // reaches the Worker is a genuine asset (JSON, SVG, JS, a font) and is
    // returned untouched — otherwise a file added to public/ later, sitting at
    // a path the router doesn't know, would start 404ing.
    const servedShell = assetResponse.headers
      .get('content-type')
      ?.includes('text/html');
    if (!servedShell) return assetResponse;

    if (isKnownPath(new URL(request.url).pathname)) return assetResponse;

    return new Response(assetResponse.body, {
      status: 404,
      statusText: 'Not Found',
      headers: assetResponse.headers,
    });
  },
} satisfies ExportedHandler<Env>;
