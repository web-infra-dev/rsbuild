# AGENTS.md

- Follow [README.md](./README.md) for helper imports, and nearby cases for fixture patterns.
- Include a `src` directory in each case. Prefer static config in `rsbuild.config.ts` for CLI debugging; use inline config for dynamic values or small per-test variations.
- Split case directories when they need different source files or Rsbuild configs.
- Reuse `@e2e/assets` where possible.
- Put case-specific package mocks in `_node_modules` and call `copyNodeModules()` before resolving them.
- Run `pnpm e2e <case-or-filter>` from the repository root for affected cases. Expand to the full suite when shared helpers or broad behavior changes justify it.
