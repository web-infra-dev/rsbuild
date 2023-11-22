- **Type:** `false | 'index'`
- **Default:** `'index'`

Whether to support html fallback. By default, it will fallback to `index.html` when the requested page is not found.

```js
export default {
  server: {
    htmlFallback: 'index',
  },
};
```
