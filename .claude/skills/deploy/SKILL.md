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
soft-404 to crawlers. **Ready to do** (was gated on the home flip, which has
now landed — the homepage links into the reader, so crawlers will follow):
put a small Worker in front of the fallback (`main` +
an `ASSETS` binding in `wrangler.toml`) that returns the SPA shell with a real
404 status for unknown paths, checking show ids via
`env.ASSETS.fetch('/shows/<id>.json')`. The Worker then holds a second copy of
the static-route list — including the gallery slugs from `src/galleries.ts` —
so pair it with a test that keeps it in sync with `src/router.tsx`. Note there
is no Worker script today (assets-only, no `main` key), so this means adding
an entry point, an `ASSETS` binding, and a tsconfig project to cover it.

The domain cutover is done: `wrangler.toml` codifies winewithoutbottles.com
and www as `custom_domain` routes on this Worker, so it serves the live site
directly.
