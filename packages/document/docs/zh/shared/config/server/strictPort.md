- **类型：** `boolean`
- **默认值：** `false`

当端口被占用时，Rsbuild 会自动递增端口号，直至找到一个可用端口。

如果你希望在端口被占用时抛出异常，可以将 `strictPort` 设置为 `true`。

### 示例

```ts
export default {
  server: {
    strictPort: true,
  },
};
```
