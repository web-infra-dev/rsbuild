- **类型：** `boolean | ((filename: string) => boolean)`
- **默认值：** `(file: string) => !file.includes('.hot-update.')`

用于控制是否将开发环境的构建产物写入到磁盘上。

Rsbuild 默认会将构建产物写入到产物目录（热更新临时文件除外）。在开发环境，你可以选择将构建产物保存在 dev server 的内存中，从而减少文件操作产生的开销。

只需要将 `dev.writeToDisk` 配置项设置为 `false` 即可：

```ts
export default {
  dev: {
    writeToDisk: false,
  },
};
```

你也可以将 `dev.writeToDisk` 设置为函数，来匹配一部分文件。

```ts
export default {
  dev: {
    writeToDisk: (file) => !file.includes('.hot-update.'),
  },
};
```
