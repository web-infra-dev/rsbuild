---
name: release-core
description: Use when asked to release `@rsbuild/core` for a specific version.
---

# Release Core

## Input

- Target version, for example `1.2.3`

If the version is missing, ask for it before making changes.

## Steps

1. Check the worktree with `git status --short`. If there are uncommitted edits, stop and ask the user how to proceed.

2. Update only the `version` field in these files to the target version:
   - `packages/core/package.json`
   - `packages/create-rsbuild/package.json`

3. Create and switch to branch `release/v<version>`. If the branch already exists, stop and ask the user how to proceed.

4. Review the diff and confirm the change is limited to the two version bumps.

5. Create a commit with this exact message: `release: v<version>`

6. Push the branch and create a GitHub PR with `gh pr create`. Use the same text for the PR title as the commit message: `release: v<version>`

7. If `.github/PULL_REQUEST_TEMPLATE.md` exists, keep its structure.
   Fill it with:
   - `Summary`: `Release @rsbuild/core and create-rsbuild <version>.`
   - `Related Links`: `https://github.com/web-infra-dev/rsbuild/releases/tag/v<version>`
