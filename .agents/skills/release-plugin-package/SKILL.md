---
name: release-plugin-package
description: Prepare a release PR and changelog for an official package under `packages/plugin-*`.
---

# Release plugin package

Resolve the package and target version from the request; ask only for missing required inputs. This skill prepares a PR, not an npm publication. Use [release-core](../release-core/SKILL.md) for the coupled core/create-rsbuild release.

## Release changes

Inspect the branch and worktree, preserving unrelated changes. Isolate work when needed, and use a task branch before committing. Follow the user's or environment's branch naming convention; otherwise `release/plugin-<name>-v<version>` is a useful name.

Confirm that `packages/plugin-<name>/package.json` names the intended package. If this release already has version edits, a changelog entry, or a PR, read [references/resume-release.md](references/resume-release.md) before choosing the baseline or editing.

For a new release, use the user-specified changelog baseline, or record the current package version and its release commit or tag before bumping it. Resolve an ambiguous range before generating the changelog.

Update:

- The plugin's package version.
- Its `CHANGELOG.md`, following the changelog rules below.
- Matching `@rsbuild/plugin-<name>` ranges in `packages/create-rsbuild/template-*/package.json` to `^<version>`. Preserve `workspace:*` dependencies in `packages/create-rsbuild/package.json`.

Review the task diff against these fields and files. Preserve pre-existing unrelated changes. Investigate unexpected edits caused by the release work before committing.

## Changelog

Create `packages/plugin-<name>/CHANGELOG.md` if missing, titled `# @rsbuild/plugin-<name>`. Add the version entry immediately below the title, or update an existing entry for that version.

```markdown
## <version> (<YYYY-MM-DD>)

### New features

- feat(plugin-<name>): change summary by @user in https://github.com/web-infra-dev/rsbuild/pull/<number>
```

Use the current date unless the user supplies one. Do not add compare links to version headings. Use `-` bullets and non-empty, sentence-case sections in this order:

- `Breaking changes`: `!` or `BREAKING CHANGE`
- `New features`: `feat`
- `Performance`: `perf`
- `Bug fixes`: `fix`
- `Refactor`: `refactor`
- `Document`: `docs`
- `Other changes`: remaining types

Prefer change PRs supplied by the user or identified in the release context. Supplement incomplete lists with commits and merged PRs since the resolved baseline. Include plugin code and directly relevant shared code, build configuration, dependencies, docs, or templates. Exclude the release/version-bump PR itself. Preserve item wording, authors, and PR URLs as much as possible.

If there are no plugin-specific changes, write `- No plugin-specific changes.` directly under the version heading, without a category heading.

## Validation

For version/changelog-only edits, validate edited JSON, matching template ranges, and changelog content. Use a focused plugin build or create-rsbuild e2e case when executable template or package behavior also changes; follow the root `AGENTS.md` build prerequisite before e2e. Avoid repository-wide spelling and e2e runs for a metadata-only bump.

## Pull request

Commit only the task changes, push the task branch, and create the PR using `.github/PULL_REQUEST_TEMPLATE.md`. Prefer the Codex GitHub connector when available; otherwise use `gh`. Consult [pr-creator](../pr-creator/SKILL.md) only when additional PR guidance is needed. Use:

- Commit and PR title: `release: @rsbuild/plugin-<name> v<version>`
- `Summary`: `Release @rsbuild/plugin-<name> v<version>.`
- An optional `Changes` section linking the same verified change PRs used in the changelog; omit it when no links are known.

Return the PR URL and relevant validation results or limitations.
