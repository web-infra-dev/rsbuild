# AGENTS.md

- Use Node.js from `.node-version` and pnpm from `package.json`.
- Keep shared dependency versions in `pnpm-workspace.yaml` catalogs.
- Run `pnpm build` once before unit or e2e tests, including focused runs; tests depend on built workspace packages.
- Prefer e2e coverage for build/dev behavior; use unit tests for single-function behavior.
