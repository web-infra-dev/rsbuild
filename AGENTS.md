# AGENTS.md

This monorepo contains the Rsbuild build tool, plugins, and related packages. Rsbuild is a high-performance JavaScript build tool powered by Rspack.

## Commands

- **Build**: `pnpm build` (all packages) | `npx nx build @rsbuild/core` (specific)
- **Test**: `pnpm test` (unit tests) | `pnpm test:watch` (watch mode) | `pnpm e2e` (E2E tests)
- **Single test**: `pnpm test packages/core/src/foo.test.ts` (unit test) | `pnpm e2e:rspack
- **Lint**: `pnpm lint` (REQUIRED before commits) | `pnpm format` (format code)

## Code Style

- **Formatting**: Single quotes, Prettier
- **Types**: TypeScript strict mode
- **Naming**: camelCase files/functions, PascalCase components/classes, kebab-case packages

## Architecture

- **Structure**: Monorepo with `packages/core/` (main), `packages/plugin-*/` (plugins)
- **Testing**: `.test.ts` files, use `rstest` runner
