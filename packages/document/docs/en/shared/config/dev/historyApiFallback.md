- **Type:** `boolean | ConnectHistoryApiFallbackOptions`
- **Default:** `false`

The index.html page will likely have to be served in place of any 404 responses. Enable `dev.historyApiFallback` by setting it to `true`:

```js
export default {
  dev: {
    historyApiFallback: true,
  },
};
```

For example, if you use client-side routing and want all page requests to fallback to index.html, you can configure it as follows:

```js
export default {
  dev: {
    historyApiFallback: {
      rewrites: [{ from: /.*\.html/, to: '/index.html' }],
    },
  },
};
```

For more options and information, see the [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) documentation.
