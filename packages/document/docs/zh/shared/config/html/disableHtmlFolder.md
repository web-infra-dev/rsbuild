- **类型：** `boolean`
- **默认值：** `true`

用于控制 HTML 产物对应的文件夹。设置该选项为 `false` 后，生成的 HTML 文件目录会从 `[name].html` 变为 `[name]/index.html`。

### 示例

默认情况下，HTML 产物在 `dist` 目录下的结构为：

重新编译后，HTML 产物在 dist 中的目录结构如下：

```bash
/dist
 └── [name].html
```

使用 `html.disableHtmlFolder` 配置:

```js
export default {
  html: {
    disableHtmlFolder: false,
  },
};
```

```bash
/dist
 └── [name]
     └── index.html
```

> 如果需要设置 HTML 文件在 dist 目录中的路径，请使用 `output.distPath.html` 配置。
