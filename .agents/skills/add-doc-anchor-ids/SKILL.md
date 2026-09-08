---
name: add-doc-anchor-ids
description: Fix or align heading anchors and hash links in the mirrored English and Chinese Rsbuild docs.
---

# Add doc anchor IDs

Work on the requested `.md`/`.mdx` files under `website/docs/en` and `website/docs/zh`, pairing files by locale-relative path. Expand the search to inbound links when changing an existing ID; a local anchor fix does not require scanning every heading.

## Anchor rules

- Use the English heading's intentional custom ID when present.
- Otherwise, use the English default anchor for headings of 4 words or fewer. For longer headings, choose a short semantic ID and apply it in both locales.
- Add a Chinese custom ID only when its default anchor differs from the desired English ID. Remove custom IDs identical to the default, including pure English headings in Chinese pages.
- MDX custom IDs use escaped syntax: `## 开发服务器 \{#dev-server}`.
- Verify the actual Rspress slug for punctuation, underscores, and duplicate-heading suffixes rather than guessing. Preserve intentional existing IDs and duplicate suffixes.

## Editing and verification

Update same-page and cross-page links to changed IDs. Search for the old hashes in Markdown links and JSX `href` attributes, including both `.md` and `.mdx` files.

Format the edited files with `pnpm exec rs fmt <edited-files>` and check the diff. Verify each changed link against its target heading. Use the docs build (`pnpm --dir website build`) when generated slugs or MDX behavior remain uncertain, rather than for every anchor edit.

Keep edits in documentation unless the user requests tooling changes; do not add persistent migration or validation scripts for a one-off anchor update.
