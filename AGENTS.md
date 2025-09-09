# AGENTS.md

This monorepo contains the Rsbuild build tool, plugins, and related packages. Rsbuild is a high-performance JavaScript build tool powered by Rspack.

## Setup

- Enable Corepack and install deps: `npm install corepack -g && corepack enable && pnpm install`
- Node.js 22+

## Commands

- **Build**: `pnpm build` (all packages) | `npx nx build @rsbuild/core` (specific)
- **Test**: `pnpm test` (unit tests) | `pnpm test:watch` (watch mode) | `pnpm e2e` (E2E tests)
- **Single test**: `pnpm test packages/core/src/foo.test.ts` (unit test) | `pnpm e2e:rspack cli/base/index.test.ts` (E2E test)
- **Lint**: `pnpm lint` (REQUIRED before commits) | `pnpm format` (format code)

## Code style

- **Formatting**: Single quotes, Prettier
- **Types**: TypeScript strict mode
- **Naming**: camelCase files/functions, PascalCase components/classes, kebab-case packages

## Architecture

- **Structure**: Monorepo (Pnpm + Nx)
  - `packages/core/`: Main Rsbuild package with CLI
  - `packages/plugin-*/`: Official plugins (React, Vue, Sass, etc.)
  - `packages/create-rsbuild/`: Project scaffolding
  - `e2e/`: End-to-end tests
  - `examples/`: Basic examples
  - `website/`: Documentation
- **Testing**: `.test.ts` files, use `rstest` runner
