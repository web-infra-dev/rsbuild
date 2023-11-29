- **Type:** `string | false`
- **Default:** `'public'`

Directory to serve as static assets (by default 'public' directory), files in this directory will be served at `/`.

Note that:

- You should always reference public assets using root absolute path. For example, `public/icon.png` should be referenced in source code as `/icon.png`.
- Assets in this directory will be copied to the root of dist during build.Therefore, care should be taken not to conflict with other dist file names.

To disable set it to `false`:

```ts
export default {
  server: {
    publicDir: false,
  },
};
```
