---
name: release-core
description: Prepare the version changes and release PR for `@rsbuild/core` and `create-rsbuild`.
---

# Release core

Resolve the target version from the request or release context; ask only if it cannot be determined. This workflow prepares a release PR; it does not publish npm packages or a GitHub release.

## Version changes

Use a dedicated branch before committing, following the user's or environment's naming convention (for example, `release/v<version>` when no prefix is specified). Reuse an existing branch only after verifying it belongs to this release. Preserve unrelated local changes; isolate the release work when needed instead of stopping for every dirty worktree.

Update:

- `packages/core/package.json`: `version`
- `packages/create-rsbuild/package.json`: `version`
- `packages/create-rsbuild/template-*/package.json`: `@rsbuild/core` dependency ranges to `^<version>`

Verify the edited JSON and all matching template ranges. Keep the release diff limited to those fields. Pure version changes do not require a build or e2e run. If the requested versions are already set, check whether a matching release PR exists before creating duplicate work.

## Release PR

Commit only the task changes, push the task branch, and create the PR. Read `.github/PULL_REQUEST_TEMPLATE.md` when drafting the description and follow its current headings and guidance. Prefer the Codex GitHub connector when available; otherwise use `gh`. Consult [pr-creator](../pr-creator/SKILL.md) only when additional PR guidance is needed. Use:

- Commit and PR title: `release: v<version>`
- Explain that the PR prepares the release of `@rsbuild/core` and `create-rsbuild` at `<version>` and updates their package versions and template dependency ranges.
- Include the release link: `https://github.com/web-infra-dev/rsbuild/releases/tag/v<version>`.

Finish with the PR URL and any unresolved release preparation issue.
