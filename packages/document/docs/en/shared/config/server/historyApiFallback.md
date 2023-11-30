- **Type:** `boolean | ConnectHistoryApiFallbackOptions`
- **Default:** `false`

When Rsbuild's default [page route](/guide/basic/page-route) logic cannot meet your needs, for example, if you want to be able to access `main.html` when accessing `/`, you can set it up using `server.historyApiFallback`.

### Example

Set `historyApiFallback.index` to `main.html`, then `main.html` can be accessed when accessing `/` or other routes that would otherwise 404.

```js
export default {
  source: {
    entry: {
      main: './src/index.ts',
    },
  },
  server: {
    htmlFallback: false,
    historyApiFallback: {
      index: '/main.html',
    },
  },
};
```

When your application contains multiple entries, you may want different visits to fallback to different pages. At this point, you can set more complex rules via the `rewrites` option:

```js
export default {
  server: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/views/landing.html' },
        { from: /^\/subpage/, to: '/views/subpage.html' },
        { from: /./, to: '/views/404.html' },
      ],
    },
  },
};
```

For more options and information, see the [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) documentation.
