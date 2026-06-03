# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Wine Without Bottles — a web-based art project by Jason Conny that translates Grateful Dead setlists into abstract striped SVGs (each stripe = a song; color derived from the title, width from duration). The site is one "vessel" for the work. Current surfaces: a placeholder homepage hero (`src/App.tsx`) and a hidden `/builder` easter-egg route that ports the original manual SVG generator. The core algorithm ("the machine") lives framework-free in `src/wwob/`.

## Commands

- `npm run dev` (alias `npm start`) — Vite dev server (HMR)
- `npm run build` — typecheck (`tsc -b`) then production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run typecheck` — type-check only (`tsc -b --noEmit`)
- `npm run format` / `npm run format:check` — Prettier write / verify
- `npm test` — Vitest in watch mode
- `npx vitest run` — run all tests once (CI-style)
- `npx vitest run tests/App.test.tsx` — run a single test file

`lint` and `typecheck` are separate steps: ESLint does not type-check, and `tsc` does not run lint rules. Run both.

Node version is pinned in `.nvmrc` (26.3.0).

## Architecture

Vite + React 19 + TypeScript SPA, migrated from Create React App.

- **Entry flow**: `index.html` (project root, not `public/`) loads `src/index.tsx`, which mounts `<App />` via React 19's `createRoot` into `#root`. Static assets live in `public/` and are served from `/`.
- **Import alias**: `@/` resolves to `src/` (configured in both `vite.config.ts` `resolve.alias` and `tsconfig.app.json` `paths`). Prefer `@/...` over deep relative imports; tests use it too (`import App from '@/App'`).
- **Env vars**: only `VITE_`-prefixed vars are exposed to the browser via `import.meta.env`; they are PUBLIC (baked into the bundle) — never secrets. See `.env.example`; local overrides go in gitignored `.env*` files.
- **TypeScript** uses project references: `tsconfig.json` is a thin root that points to `tsconfig.app.json` (app code under `src/`, bundler resolution, strict) and `tsconfig.node.json` (the Vite config). Edit the appropriate child, not the root.
- **Testing** is configured inside `vite.config.ts` (not a separate Vitest config) — jsdom environment, globals enabled, with `tests/setup.ts` registering `@testing-library/jest-dom`. Tests use Testing Library and live in `tests/` (not co-located with source), importing from `../src`. They are type-checked because `tests` is in `tsconfig.app.json`'s `include`.
- **Styles** are SCSS (`sass`), imported directly into components (e.g. `App.tsx` imports `./App.scss`). No CSS modules or CSS-in-JS.

## Conventions

- **Mobile-first responsive design**: author base styles for the smallest viewport first, then layer complexity for larger screens with `min-width` media queries (not `max-width`/desktop-down). Favor fluid, relative units (`rem`, `%`, `vw`/`vh`, `clamp()`) over fixed `px` for anything that should adapt. Applies to all new and updated SCSS. Use the breakpoint system in `src/styles/_breakpoints.scss` (`@use` it, then `@include respond-to('md') { … }`).
- **Accessibility**: no formal WCAG conformance level is targeted, but stay mindful — semantic HTML, labeled form controls, visible focus states, never convey meaning by color alone, and respect `prefers-reduced-motion`. Deliberate exception: the homepage `<h1>` is a brand **logotype** rendered as an intentional low-contrast watermark over the artwork (WCAG 1.4.3 exempts logotypes from contrast); its accessible name is preserved via real `<h1>` text + the document `<title>`. Do not "fix" the heading's contrast — automated scanners (axe/Lighthouse) will flag it, and that is expected.
- Prettier with single quotes (`.prettierrc.json`) — run `npm run format` before committing.
- ESLint uses flat config with `typescript-eslint`, `react-hooks` (`configs.flat.recommended`), and `react-refresh`. Note the v7 react-hooks gotcha: the flat config lives under `reactHooks.configs.flat.*`; the top-level `recommended`/`recommended-latest` keys are legacy eslintrc format and will not load in flat config.
- Routing uses `react-router-dom` v7 (`createBrowserRouter` + `RouterProvider` in `src/index.tsx`); routes are defined in `src/router.tsx`. `/` → `App` (hero), `/builder` → the unlinked builder easter egg, `*` → redirect home. `public/_redirects` provides SPA fallback for static hosting.
