---
name: docs-en-improvement
description: Polish unnatural English prose in `website/docs/en` while preserving technical meaning.
---

# English documentation

Rewrite sentences that materially improve clarity or naturalness. Preserve the original meaning; do not add claims or remove technical details. Keep reasonable abbreviations such as `dev server`; use simple English for non-native readers and sentence-case headings.

Work within the requested files or topic. Limit each PR to 10 documentation files or fewer, including changes in both languages. A prose-only English correction does not require translating the Chinese page again. If the user also requests technical corrections or changes to examples or structure, mirror those changes under `website/docs/zh`.

Format edited files with `pnpm exec rs fmt <edited-files>`. If creating a PR is requested, use a `docs:` title and the repository's `pr-creator` skill.
