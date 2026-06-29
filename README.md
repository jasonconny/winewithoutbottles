# Wine Without Bottles

A web-based art project by [Jason Conny](http://www.jasonconny.com/) that
renders Grateful Dead setlists as striped SVGs. Live at
<https://winewithoutbottles.com>.

Vite + React 19 + TypeScript SPA, SCSS styles, deployed to a Cloudflare Worker.

## Getting started

Node version is pinned in [`.nvmrc`](.nvmrc) (`nvm use`).

```bash
npm install
npm run dev
```

## Scripts

| Command                           | What it does                                                |
| --------------------------------- | ----------------------------------------------------------- |
| `npm run dev` (alias `npm start`) | Dev server with hot reload                                  |
| `npm run build`                   | Type-check, then production build to `dist/`                |
| `npm run preview`                 | Serve the production build locally                          |
| `npm run generate`                | Rebuild SVGs + per-show JSON + bundled index from show data |
| `npm test`                        | Vitest watch mode (`npx vitest run` for one CI-style pass)  |
| `npm run lint`                    | ESLint                                                      |
| `npm run typecheck`               | Type-check only                                             |
| `npm run format` / `format:check` | Prettier write / verify                                     |
| `npm run deploy`                  | Build and deploy to Cloudflare (`wrangler deploy`)          |

`lint` and `typecheck` are separate steps — run both.

## Show data

Shows are hand-authored as JSON in [`data/shows/`](data/shows/) (`YYYY-MM-DD.json`,
by year) — the source of truth. A generator turns that into committed artifacts:
`public/shows/<id>.svg`, `public/shows/<id>.json`, and the bundled index
`src/data/shows.generated.ts`. After editing data, regenerate and commit:

```bash
npm run generate 1977-05-08      # one show
npm run generate '1977-*'        # a quoted glob
npm run generate                 # everything
```

## Deploy

Pushes to `main` auto-deploy via GitHub Actions once CI passes. `npm run deploy`
is available for manual deploys.
