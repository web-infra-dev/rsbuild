---
name: write-e2e-cases
description: Add or update Rsbuild regression and feature tests in `e2e/cases`.
---

# Write e2e cases

Use [e2e/README.md](../../../e2e/README.md) for helper conventions and warning assertions, and a nearby case for the relevant fixture pattern.

## Case conventions

- Use `@e2e/helper` for Rsbuild fixtures (`test`, `dev`, `build`). Import generic utilities such as `getDistFiles`, `findFile`, and `getFileContent` directly from `@rstackjs/test-utils`.
- Include a `src` directory in each case. Prefer static config in `rsbuild.config.ts` for debugging with `npx rsbuild`; use inline config for dynamic values or small per-test variations.
- Split case directories when they need different source files or Rsbuild configs.
- Reuse `@e2e/assets` where possible. Put case-specific package mocks in `_node_modules` and call `copyNodeModules()` before resolving them.
- Assert observable behavior with stable assertions. Use `expectWarning()` for expected build warnings; unexpected warnings fail tests by default.

## Validation and completion

Follow the root `AGENTS.md` build prerequisite, then run `pnpm e2e <case-or-filter>` for the affected cases. Expand to the full suite when shared helpers or broad behavior changes justify it.

For a bug-fix or feature request, make the source changes needed by the requested behavior and rerun affected tests. For a reproduction-only or tests-only request, preserve that boundary and report the expected failure and required source fix.
