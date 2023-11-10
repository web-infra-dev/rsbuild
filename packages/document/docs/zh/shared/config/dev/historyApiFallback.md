- **类型：** `boolean | ConnectHistoryApiFallbackOptions`
- **默认值：** `false`

在需要对一些 404 响应或其他请求提供替代页面的场景，可通过 `dev.historyApiFallback` 进行设置：

```js
export default {
  dev: {
    historyApiFallback: true,
  },
};
```

例如，当你使用客户端路由，希望所有页面请求都可以 fallback 到 index.html 时，可以配置成如下方式：

```js
export default {
  dev: {
    historyApiFallback: {
      // 允许对 .html 请求进行 fallback
      rewrites: [{ from: /.*\.html/, to: '/index.html' }],
    },
  },
};
```

更多选项和详细信息可参考 [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback) 文档。
