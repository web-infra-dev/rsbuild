# Continue a plugin release

Read this when the target release already has version edits, a changelog entry, or a PR.

- Verify the existing work belongs to the requested package and target version before reusing its branch or PR. Preserve unrelated changes.
- Honor a user-specified baseline. Otherwise, recover the pre-bump package version and its release commit or tag from Git history or the preceding published package release. The working-tree version may already be the target version and is not a valid baseline in that case. Resolve an ambiguous range with the user before regenerating notes.
- Complete missing version, template, and changelog changes using the main skill's rules. Preserve valid existing notes and update the target entry rather than duplicating it.
- Update the matching PR when one exists. If the release is already complete, report its status instead of creating another PR.
