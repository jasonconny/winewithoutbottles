---
name: deploy
description: Deploy Wine Without Bottles or explain its Cloudflare Workers deploy setup. Use when running a deploy, touching wrangler.toml or the CI deploy job, or discussing the SPA 404-handling plan.
---

**Deploy**: Cloudflare Worker with Static Assets (not Pages). `wrangler.toml`
deploys `dist/` as Worker `winewithoutbottles` via `npm run deploy` (builds
first). Pushes to `main` auto-deploy via the `deploy` job in
`.github/workflows/ci.yml` (gated on CI passing; uses the
`CLOUDFLARE_API_TOKEN` repo secret); `npm run deploy` remains for manual/local
deploys. `not_found_handling = "single-page-application"` gives SPA deep-link
fallback (no `_redirects` file needed) — note this answers **every** unknown
path with `index.html` + 200, so the client-rendered `NotFound` page is a
soft-404 to crawlers on its own — so `worker/index.ts` sits in front of it and
corrects the status.

**How the 404 handling works.** `worker/index.ts` calls `env.ASSETS.fetch()`,
and when the response is the HTML shell for a path the app doesn't serve, it
re-emits the same body with a 404. Non-HTML responses pass through untouched,
so a file added to `public/` later can't start 404ing. The route list lives in
`worker/routes.ts`, built from the same `src/galleries.ts` registry
`src/router.tsx` uses — so gallery slugs and show ids can't drift between edge
and client. Show ids come from the bundled index, **not** from probing
`/shows/<id>.json`: with SPA `not_found_handling`, a missing asset answers with
the shell and a 200, so probing can't tell a real show from a fake one.

Two config details that are load-bearing:

- `run_worker_first` is required. Navigation requests (`Sec-Fetch-Mode: navigate`)
  otherwise skip the Worker entirely and go straight to the SPA fallback. The
  negated patterns keep hashed bundles and the ~350 per-show files off the Worker.
- `compatibility_date` is capped by the pinned wrangler's local `workerd`
  (4.114.0 tops out at 2026-07-29). A later date deploys fine but makes
  `wrangler dev` refuse to start.

`tsconfig.worker.json` type-checks `worker/` (it's outside every other project's
`include`, so without it the Worker is silently unchecked); `npm run typecheck`
runs it. `tests/worker-routes.test.ts` pins the Worker's route list against
`src/router.tsx`.

The domain cutover is done: `wrangler.toml` codifies winewithoutbottles.com
and www as `custom_domain` routes on this Worker, so it serves the live site
directly.
