---
name: release-plugin-package
description: Use when asked to create a release PR for an official Rsbuild plugin package under `packages/plugin-*`, such as `@rsbuild/plugin-react v2.1.0` or `@rsbuild/plugin-sass v2.0.0`.
---

# Release Plugin Package

## Input

- Plugin package name or short name, for example `@rsbuild/plugin-react` or `plugin-react`.
- Target version, for example `2.1.0`.

If the package or version is missing, ask for it before making changes.

## Scope

Use this skill only for official plugin packages in `packages/plugin-*`.

Do not use it for:

- `@rsbuild/core` or `create-rsbuild` releases. Use `release-core` instead.
- Publishing npm packages directly. This skill creates the release PR only.

## Workflow

1. Check the worktree:

   ```bash
   git status --short
   git branch --show-current
   ```

   If there are uncommitted edits, stop and ask the user how to proceed.

2. Resolve the package directory:

   - `@rsbuild/plugin-react` -> `packages/plugin-react`
   - `plugin-react` -> `packages/plugin-react`

   Confirm that `packages/plugin-<name>/package.json` exists and its `name` field matches the target package.

3. Create and switch to a dedicated branch if the current branch is the default branch. Prefer:

   ```text
   release/plugin-<name>-v<version>
   ```

4. Update only the plugin package version first:

   ```text
   packages/plugin-<name>/package.json
   ```

5. Sync `create-rsbuild` template dependency versions only when that plugin appears in template `package.json` files:

   ```bash
   rg -n '@rsbuild/plugin-<name>' packages/create-rsbuild --glob 'package.json'
   ```

   Update matching template dependency ranges to `^<version>`. Do not change `workspace:*` dev dependencies in `packages/create-rsbuild/package.json`.

6. Review the diff and confirm it is limited to:

   - the released plugin package version
   - matching `packages/create-rsbuild/template-*/package.json` dependency ranges, if any

   If other files changed, stop and explain the unexpected diff.

7. Validate JSON and run focused checks:

   ```bash
   node -e "for (const f of process.argv.slice(1)) JSON.parse(require('fs').readFileSync(f, 'utf8'))" <edited-package-json-files>
   pnpm --filter @rsbuild/plugin-<name> run build
   ```

   If `create-rsbuild` templates changed, also run the focused create-rsbuild e2e case when practical:

   ```bash
   pnpm e2e create-rsbuild
   ```

   Report any skipped validation in the final response.

8. Commit with this exact title:

   ```text
   release: @rsbuild/plugin-<name> v<version>
   ```

9. Push the branch after re-checking it is not the default branch.

10. Create the PR using the GitHub workflow available in the current environment.

## PR Body

Use the repository PR template. Keep the body concise.

For `Summary`, use:

```markdown
Release `@rsbuild/plugin-<name>` v<version>.
```

If related change PRs were provided or can be confidently identified, add a `Changes` section:

```markdown
## Changes

- https://github.com/web-infra-dev/rsbuild/pull/<number>
- https://github.com/web-infra-dev/rsbuild/pull/<number>
```

Do not invent change links. If no related links are known, omit `Changes` instead of adding an empty section.
