# Rsbuild - High-Performance Rspack-based Build Tool

Rsbuild is a monorepo containing the core Rsbuild build tool, plugins, and related packages. It's a high-performance build tool powered by Rspack with TypeScript, JavaScript, React, Vue, and other framework support.

## Setup & Build

**Setup (NEVER CANCEL - takes 2+ minutes):**

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
pnpm test                     # Unit tests (~10s)
pnpm e2e                      # E2E tests (~60s)
pnpm lint                     # Lint code (~5s) - REQUIRED before finishing
pnpm format                   # Format code
```

**E2E tests (NEVER CANCEL - takes 10+ minutes):**

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
