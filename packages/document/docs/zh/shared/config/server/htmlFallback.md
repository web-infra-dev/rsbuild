- **类型：** `false | 'index'`
- **默认值：** `'index'`

是否支持页面回退。默认情况下，当请求满足以下条件且未找到对应资源时，会回退到 index.html：

- 当前请求是 GET 或 HEAD 请求
- 当前请求头接受 `text/html` (请求头 accept 类型为 `text/html` 或 `*/*`)

```js
export default {
  server: {
    htmlFallback: 'index',
  },
};
```

:::tip
当 htmlFallback 无法你的需求时，可通过 [server.historyApiFallback](/config/server/history-api-fallback) 进行更灵活的设置。
:::
