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
pnpm test core                # Package-specific tests
pnpm lint                     # Lint code (~5s) - REQUIRED before finishing
pnpm format                   # Format code
```

**E2E tests (NEVER CANCEL - takes 10+ minutes):**
```bash
cd e2e && pnpm install && npx playwright install chromium
pnpm run e2e:rspack
```

**CLI testing:**
```bash
node packages/core/bin/rsbuild.js --help
node packages/core/bin/rsbuild.js build --root <project-directory>
node packages/core/bin/rsbuild.js dev --root <project-directory>
```

**Note:** Projects need `src/index.js` entry point or custom `source.entry` config.

## Repository Structure

**Key directories:**
- `packages/core/` - Main Rsbuild package with CLI
- `packages/plugin-*/` - Official plugins (React, Vue, Sass, etc.)
- `packages/create-rsbuild/` - Project scaffolding
- `e2e/` - End-to-end tests
- `examples/` - Framework examples

**Important files:**
- `packages/core/src/cli/commands.ts` - CLI commands
- `packages/core/bin/rsbuild.js` - CLI entry point
- `packages/core/src/provider/rspackConfig.ts` - Core config

## Development Notes

- CLI commands: `dev`, `build`, `preview`, `inspect`
- Plugin pattern: `export const pluginName = (): RsbuildPlugin => ({ ... })`
- Uses NX for builds, Rslib for packaging
- Node.js 18.12.0+, pnpm 10.14.0+
- Framework support: React, Vue, Preact, Svelte, Solid

**Timing expectations:** Initial install 1-2min, builds 1-60s (cached/fresh), tests 8-15s, E2E 5-15min
