---
name: pr-creator
description: Use when asked to create a pull request for this repository. It helps the PR follow the repository's branch safety rules, title convention, pull request template, and concise English writing style.
---

# Pull Request Creator

## Steps

1. Confirm the current branch with `git branch --show-current`.
   If it is the default branch, create and switch to a new branch before doing anything else.
   Use a descriptive branch name, preferably `feat-<topic>` or `fix-<topic>`.

2. Review local changes with `git status --short`.
   Do not revert unrelated user changes.
   Before creating the PR, ensure the intended changes are committed and never commit directly on the default branch.

3. If `.github/PULL_REQUEST_TEMPLATE.md` exists, read it and keep its structure exactly.

4. Draft the PR title in the repository's standard format. If the repository uses Conventional Commits, common patterns include:
   - `feat(core): add ...`
   - `fix(plugin-less): ...`
   - `docs: ...`
   - `refactor(types): ...`
   - `chore(deps): ...`
   - `release: v1.2.0`

5. Write the PR body in concise, clear English.
   - In `Summary`, explain the user-facing problem or maintenance goal first, then the main change.
   - Keep it short: one compact paragraph or 2-4 bullets is usually enough.
   - Focus on what changed and why it matters; avoid low-signal implementation detail.
   - Good background examples:
     - `This PR adds support for custom logger injection so CLI output can be isolated per instance.`
     - `This PR fixes incorrect padding in URL labels to keep terminal output aligned across different label lengths.`
     - `This PR updates the English docs to clarify how the extraction option works and when to enable it.`

6. Fill `Related Links` with issue links, design docs, related PRs, or discussion pages.
   If the PR upgrades an npm dependency, add a link to the upgraded version's release notes or tag page when available.
   Example: `https://github.com/web-infra-dev/rspack/releases/tag/v1.0.0`
   If there is no relevant link, leave a short note such as `None`.

7. Push the branch only after re-checking the branch name. Never push the default branch directly.

8. Create the PR with `gh pr create`.
