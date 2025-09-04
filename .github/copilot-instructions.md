# Rsbuild

This is a monorepo contains the Rsbuild build tool, plugins, and related packages. Rsbuild is a high-performance JavaScript build tool powered by Rspack.

## Setup & Build

**Setup (NEVER CANCEL):**

```bash
npm install corepack@latest -g && corepack enable
pnpm install  # Includes build via prepare script
```

**Build commands:**

```bash
pnpm build                    # All packages
npx nx build @rsbuild/core    # Specific package
```

## Development

**Testing:**

```bash
pnpm test                     # Unit tests
pnpm e2e                      # E2E tests
pnpm lint                     # Lint code - REQUIRED before finishing
pnpm format                   # Format code
```

**E2E tests (NEVER CANCEL):**

```bash
cd e2e && pnpm install && npx playwright install chromium
pnpm run e2e:rspack
```

## Repository Structure

**Key directories:**

- `packages/core/` - Main Rsbuild package with CLI
- `packages/plugin-*/` - Official plugins (React, Vue, Sass, etc.)
- `packages/create-rsbuild/` - Project scaffolding
- `e2e/` - E2E tests
- `examples/` - Basic Examples
- `website/` - Documentation

## Development Notes

- Rsbuild CLI commands: `dev`, `build`, `preview`, `inspect`
- Uses NX for builds, Rslib for bundling
- Node.js 22+
