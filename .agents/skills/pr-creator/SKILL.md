---
name: pr-creator
description: Create a pull request using repository branch rules, title conventions, templates, and concise English descriptions.
metadata:
  internal: true
---

# Pull Request Creator

## Steps

1. Confirm the current branch with `git branch --show-current`.
   If it is the default branch, create and switch to a new branch before doing anything else.
   Use a descriptive branch name, preferably `feat-<topic>` or `fix-<topic>`.

2. Review local changes with `git status --short`.
   Do not revert unrelated user changes.
   Before creating the PR, ensure the intended changes are committed and never commit directly on the default branch.

3. Read the repository's PR template when available and follow its current headings and guidance.

4. Draft the PR title in the repository's standard format. If the repository uses Conventional Commits, common patterns include:
   - `feat(core): add ...`
   - `fix(types): ...`
   - `docs: ...`
   - `refactor(types): ...`
   - `chore(ci): ...` for CI workflow, check, or release automation changes
   - `chore(deps): ...`
   - `release: v1.2.0`

5. Write the PR body in concise, clear English.
   - Explain the problem or motivation and why it matters, then describe the approach and resulting behavior.
   - Include API, compatibility, or migration details when they help reviewers assess the change.
   - Keep typical descriptions to a few short sentences. Focus on the key changes rather than a file-by-file summary.
   - Mention tests, documentation, and validation only when required by the template, central to the change, or relevant to review risk.

6. Include relevant issue, discussion, or design links alongside the context they support, following the template's guidance.
   For dependency upgrades, link to the target version's release notes or tag when available.

7. Push the branch only after re-checking the branch name. Never push the default branch directly.

8. Create the PR.
   When running in Codex, use the Codex GitHub connector/plugin for GitHub operations.
   Use `gh pr create` only as a fallback when the connector is unavailable.

## Constraints

- Do not modify code while following this skill.
