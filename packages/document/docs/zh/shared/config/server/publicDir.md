- **类型：** `string | false`
- **默认值：** `'public'`

作为静态资源服务的文件夹（默认为 public 目录），该目录中的文件可在 `/` 路径下访问，

需要注意的是：

- 引入 public 中的资源永远应该使用根绝对路径。例如，`public/icon.png` 应该在源码中被引用为 `/icon.png`。
- 在生产环境构建过程中，该目录中的文件将会被拷贝到 dist 目录下，应注意不要和其他产物文件名冲突。
- public 中的资源不应该被 JavaScript 文件引用。

通过将 `publicDir` 设置成 `false` 可禁用此功能：

```ts
export default {
  server: {
    publicDir: false,
  },
};
```
