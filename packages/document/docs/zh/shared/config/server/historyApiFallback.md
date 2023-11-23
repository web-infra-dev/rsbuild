- **类型：** `boolean | ConnectHistoryApiFallbackOptions`
- **默认值：** `false`

如果 Rsbuild 默认的 `server.htmlFallback` 配置无法满足你的需求，在需要对一些 404 响应或其他请求提供替代页面的场景，你可以通过 `server.historyApiFallback` 进行设置。

### 示例

当 `historyApiFallback` 为 `true` 时，需要 fallback 的请求会被重写为 `/index.html`。

```js
export default {
  server: {
    historyApiFallback: true,
  },
};
```

你也可以通过 `rewrites` 选项来设置更复杂的规则：

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
