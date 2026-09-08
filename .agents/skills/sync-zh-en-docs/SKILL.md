---
name: sync-zh-en-docs
description: Sync uncommitted documentation changes between `website/docs/zh` and `website/docs/en`.
---

# Documentation sync

Inspect staged, unstaged, and new docs in the requested scope. Map each source file to the same locale-relative path in the other language.

Translate the changed content, preserving technical meaning, structure, commands, and code unless localization is needed. Preserve unrelated edits in both languages. If both counterparts changed, reconcile compatible edits; ask only when conflicting technical meanings cannot be resolved from the request and context.

Keep corresponding heading IDs and links aligned. Use [add-doc-anchor-ids](../add-doc-anchor-ids/SKILL.md) when headings or hashes change.

Format only the edited files with `pnpm exec rs fmt <edited-files>` and review the paired diff for omissions or accidental changes to code examples.
