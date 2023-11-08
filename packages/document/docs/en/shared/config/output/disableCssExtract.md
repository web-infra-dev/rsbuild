- **Type:** `boolean`
- **Default:** `false`

Whether to disable CSS extract and inline CSS files into JS files.

By default, Rsbuild will extract CSS into a separate `.css` file and output it to the dist directory. When this option is set to `true`, CSS files will be inlined into JS files and inserted on the page at runtime via `<style>` tags.

### Example

```ts
export default {
  output: {
    disableCssExtract: true,
  },
};
```

### Notes

It is recommended to only enable the `disableCssExtract` option in the development environment.

For production builds, it is recommended to use the default behavior of Rsbuild, which extracts CSS into separate bundles to allow browsers to load CSS and JS assets in parallel.

For example:

```ts
export default {
  output: {
    disableCssExtract: process.env.NODE_ENV === 'development',
  },
};
```

If you need to enable this option in the production environment, please note that the inlined CSS code will not go through Rsbuild's default CSS minimizer. You can manually register the [cssnano](https://cssnano.co/) plugin for PostCSS to compress the inlined code.

1. Install cssnano:

```bash
npm add cssnano -D
```

2. Register cssnano using `tools.postcss`:

```ts
export default {
  tools: {
    postcss: (opts) => {
      opts.postcssOptions.plugins.push(require('cssnano'));
    },
  },
};
```
