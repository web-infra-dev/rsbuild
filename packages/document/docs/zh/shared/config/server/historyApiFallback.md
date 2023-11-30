- **类型：** `boolean | ConnectHistoryApiFallbackOptions`
- **默认值：** `false`

当 Rsbuild 默认的 [页面路由](/guide/basic/page-route) 逻辑无法满足你的需求时，例如，希望在访问 `/` 时可以访问 `main.html`，可通过 `server.historyApiFallback` 进行设置。

### 示例

将 `historyApiFallback.index` 设置为 `main.html`，此时在访问 `/` 或其他原本会 404 的路由时可以访问到 `main.html`。

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

当你的应用包含多个 entry 时，你可能希望不同的访问可以 fallback 到不同的页面上。此时，你可以通过 `rewrites` 选项来设置更复杂的规则：

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

更多选项和详细信息可参考 [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) 文档。
