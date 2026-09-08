---
name: upgrade-rspack
description: Upgrade `@rspack/core` in this repository, validate compatibility, and prepare a pull request.
---

# Upgrade Rspack

Resolve the requested target version; ask if it is unspecified and cannot be inferred from the request. If the user limits the task to local changes or inspection, honor that scope.

## Dependency update

- Inspect the branch and worktree. Preserve unrelated edits and use an isolated checkout if needed. Create a task branch before committing when on the default branch; never commit directly to it.
- Change the default catalog's `@rspack/core` entry in `pnpm-workspace.yaml` to `~<version>`, preserving package dependencies as `catalog:`.
- Run `pnpm update @rspack/core --recursive` to update dependencies and the lockfile. A separate install is only needed if dependency resolution or installation remains incomplete.
- Review the catalog and lockfile diff for unintended dependency changes. If already at the requested version with no changes, report that instead of creating an empty commit or PR.

## Validation

Rspack affects the entire build pipeline, so run `pnpm build`, `pnpm test`, and `pnpm e2e` once for the upgrade. Investigate failures and fix compatibility issues within the requested scope, then rerun the affected checks. Rebuild when source changes require fresh outputs.

Do not commit or create the PR while required checks remain failed or incomplete. Report an unresolved blocker with its evidence; ask only when resolution requires a scope or compatibility decision from the user.

## Pull request

Commit only the task changes, push the task branch, and create the PR using `.github/PULL_REQUEST_TEMPLATE.md`. Prefer the Codex GitHub connector when available; otherwise use `gh`. Consult [pr-creator](../pr-creator/SKILL.md) only when additional PR guidance is needed. Use:

- Commit and PR title: `feat(deps): update @rspack/core to <version>`
- `Summary`: `Update @rspack/core to <version>.` Add relevant compatibility changes if needed.
- `Related links`: `https://github.com/web-infra-dev/rspack/releases/tag/v<version>`
