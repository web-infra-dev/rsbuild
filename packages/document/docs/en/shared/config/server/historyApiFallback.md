- **Type:** `boolean | ConnectHistoryApiFallbackOptions`
- **Default:** `false`

If the default `server.htmlFallback` configuration of Rsbuild does not meet your requirements, and you need to provide alternative pages for some 404 responses or other requests, you can set it up using `server.historyApiFallback`.

### Example

When `historyApiFallback` is set to `true`, requests that require fallback will be rewrite to `/index.html`.

```js
export default {
  server: {
    historyApiFallback: true,
  },
};
```

You can also set more complex rules using the `rewrites` option:

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
