- **类型：** `false | 'index'`
- **默认值：** `'index'`

是否支持页面回退。默认情况下，当请求的页面找不到时会回退到 `index.html`。

```js
export default {
  server: {
    htmlFallback: 'index',
  },
};
```
