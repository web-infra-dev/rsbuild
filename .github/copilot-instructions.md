# Rsbuild - High-Performance Rspack-based Build Tool

Rsbuild is a monorepo containing the core Rsbuild build tool, plugins, and related packages. It's a high-performance build tool powered by Rspack with TypeScript, JavaScript, React, Vue, and other framework support.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build

- **NEVER CANCEL**: Initial setup takes 2+ minutes. Set timeout to 180+ seconds.
- Install corepack and enable pnpm:
  ```bash
  npm install corepack@latest -g
  corepack enable
  ```
- Install dependencies (includes automatic build via prepare script):

  ```bash
  pnpm install
  ```

  **NEVER CANCEL**: Takes 1-2 minutes including full build. Set timeout to 180+ seconds.

- Build all packages manually:

  ```bash
  pnpm build
  ```

  **TIMING**: Subsequent builds are cached and take ~1 second. Fresh builds take 30+ seconds.

- Build specific package:
  ```bash
  npx nx build @rsbuild/core
  ```

### Testing

- Run unit tests (fast, 8-10 seconds):

  ```bash
  pnpm test
  ```

- Run E2E tests (requires Playwright install):

  ```bash
  cd e2e && pnpm install && npx playwright install chromium
  pnpm run e2e:rspack
  ```

  **NEVER CANCEL**: E2E tests can take 10+ minutes. Set timeout to 900+ seconds.

- Run specific package tests:
  ```bash
  pnpm test core
  ```

### Linting and Formatting

- Lint code (takes ~5 seconds):

  ```bash
  pnpm lint
  ```

- Format code:
  ```bash
  pnpm format
  ```

### Development Commands

- Test Rsbuild CLI functionality:

  ```bash
  # From repo root
  node packages/core/bin/rsbuild.js --help
  node packages/core/bin/rsbuild.js build --root <project-directory>
  node packages/core/bin/rsbuild.js dev --root <project-directory>
  ```

  **IMPORTANT**: Projects must have `src/index.js` (or `.ts`) as entry point, or customize via `source.entry` config.

- Test create-rsbuild:
  ```bash
  node packages/create-rsbuild/dist/index.js --help
  ```

## Validation

- **CRITICAL**: Always run `pnpm lint` before finishing - CI will fail without it.
- Always manually test CLI commands when modifying core functionality.
- Test both `rsbuild build` and `rsbuild dev` commands on simple projects.
- **VALIDATION SCENARIOS**: When modifying build logic, create a simple test project with basic JavaScript/TypeScript files and verify:
  1. Create `src/index.js` with basic content (Rsbuild requires this entry point)
  2. `rsbuild build` produces correct output in `dist/` folder
  3. `rsbuild dev` starts dev server on http://localhost:3000
  4. Build artifacts are correct (check generated HTML, JS files)

## Repository Structure

### Key Directories

- `packages/core/` - Main Rsbuild package with CLI and build logic
- `packages/plugin-*/` - Official Rsbuild plugins (React, Vue, Sass, etc.)
- `packages/compat/` - Compatibility packages (webpack adapter)
- `packages/create-rsbuild/` - Project scaffolding tool
- `e2e/` - End-to-end tests using Playwright
- `examples/` - Example projects for different frameworks
- `website/` - Documentation website source
- `scripts/` - Build and utility scripts

### Important Files

- `packages/core/src/cli/` - CLI command definitions and logic
- `packages/core/bin/rsbuild.js` - Main CLI entry point
- `packages/core/src/provider/rspackConfig.ts` - Core Rspack configuration
- `nx.json` - NX build orchestration config
- `pnpm-workspace.yaml` - Workspace configuration

## Common Tasks

### CLI Development

- CLI commands are defined in `packages/core/src/cli/commands.ts`
- Available commands: `dev`, `build`, `preview`, `inspect`
- Always test CLI changes with real projects in `/tmp`

### Plugin Development

- Plugins follow the pattern: `export const pluginName = (): RsbuildPlugin => ({ ... })`
- Plugin structure in `packages/plugin-*/src/index.ts`
- Always add tests in `packages/plugin-*/tests/`

### Build System Changes

- Uses NX for parallel builds and caching
- Prebundling uses `ncc` to compile dependencies
- Uses Rslib for package building

## Environment Requirements

- **Node.js**: 18.12.0+ (repo uses Node 22)
- **pnpm**: 10.14.0+ (managed via corepack)
- **OS Support**: Linux, macOS, Windows

## Build Timing Expectations

- **Initial pnpm install**: 1-2 minutes (includes build)
- **Subsequent builds**: 1-5 seconds (cached)
- **Fresh builds**: 30-60 seconds
- **Unit tests**: 8-15 seconds
- **Linting**: 3-6 seconds
- **E2E tests**: 5-15 minutes (when Playwright works)

**REMEMBER**: Always set appropriate timeouts. NEVER CANCEL long-running commands.

## Frequent CLI Commands Reference

```bash
# Setup
npm install corepack@latest -g && corepack enable
pnpm install

# Development
pnpm build                           # Build all packages
pnpm test                           # Run unit tests
pnpm lint                           # Lint code
pnpm format                         # Format code
npx nx build @rsbuild/core          # Build specific package

# Testing Rsbuild CLI
node packages/core/bin/rsbuild.js --help
node packages/core/bin/rsbuild.js build --root /path/to/project
node packages/core/bin/rsbuild.js dev --root /path/to/project

# Create new project
node packages/create-rsbuild/dist/index.js
```

## Framework Support

Current framework plugins: React, Vue, Preact, Svelte, Solid. Each has corresponding plugin package and examples.
