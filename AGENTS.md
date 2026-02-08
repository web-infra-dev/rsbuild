# AGENTS.md

## Stack

- Node.js `22+`
- `pnpm` workspace + `Nx` monorepo
- TypeScript (strict mode), Rspack/Rsbuild ecosystem
- Test runner: `rstest`

## Commands (run early)

```bash
# setup
corepack enable && pnpm install

# dev checks
pnpm lint
pnpm test
pnpm e2e

# focused work
npx nx build @rsbuild/core
pnpm test packages/core/tests/foo.test.ts
pnpm e2e css
```

## Project structure

```text
packages/core/              # core + CLI
packages/plugin-*/          # official plugins
packages/create-rsbuild/    # scaffolding tool
e2e/                        # end-to-end tests
examples/                   # runnable examples
website/                    # docs site
```

## Code style

- Use single quotes and existing Prettier conventions.
- Keep TypeScript strict-safe; avoid `any`.
- Naming: camelCase (functions/files), PascalCase (types/classes).
