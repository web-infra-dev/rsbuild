---
name: sync-zh-en-docs
description: Sync uncommitted docs between `website/docs/zh` and `website/docs/en`. Use for zh/en doc alignment, bidirectional `.md`/`.mdx` translation, consistent technical writing, and final formatting with `pnpm format`.
---

# Sync Zh/En Documentation

## Steps

1. Check uncommitted changes:

2. Translate each changed file to the counterpart path (`zh` <-> `en`), and keep:

- meaning and structure consistent
- technical terms / commands / code blocks unchanged unless localization is required
- concise, clear, professional technical-doc style

3. Format and verify:

```bash
pnpm format
```
