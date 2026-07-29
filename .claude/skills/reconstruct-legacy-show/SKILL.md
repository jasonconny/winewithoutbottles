---
name: reconstruct-legacy-show
description: Bootstrap a Wine Without Bottles show's data/shows JSON from Jason's original 2013 SVGs via generator/verify.ts. Use when reconstructing a legacy show that doesn't have authored data yet, or verifying authored data against the original art.
---

Reconstructing a legacy show is a bootstrap from Jason's original 2013 SVGs via
`npx tsx generator/verify.ts <id>`: extract mode (no data file yet) dumps each
stripe's target colour + width; verify mode (data file present) checks the
authored setlist against them (durations from stripe widths, titles
color-verified — a wrong title fails the colour check). `verify.ts` is a
permanent dev tool, but the legacy SVGs it reads are **transient working
inputs**: drop the masters into `tests/fixtures/legacy/<id>.svg` for the batch
you're reconstructing (gitignored — Jason keeps the masters off-repo). The
originals encode their own mistakes, which we correct over time (logged in
`data/CORRECTIONS.md`), so there is **no fidelity checksum**.
