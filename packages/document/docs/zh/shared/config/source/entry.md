- **类型：**

```ts
type Entry = Record<string, string | string[]>;
```

- **默认值：**

```ts
const defaultEntry = {
  index: 'src/index.(ts|js|tsx|jsx|mjs|cjs)',
};
```

用于设置构建的入口模块。

`source.entry` 的用法与 Rspack 的 [entry](https://rspack.dev/config/entry) 选项类似，它们的主要区别在于，Rsbuild 会为 `source.entry` 中的每一个入口注册 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)，从而生成对应的 HTML 文件。

- **示例：**

```ts
export default {
  source: {
    entry: {
      foo: './src/pages/foo/index.ts',
      bar: './src/pages/bar/index.ts',
    },
  },
};
```

生成的目录结构如下：

```text
.
├── foo.html
├── bar.html
└── static
    ├── css
    │   ├── foo.css
    │   └── bar.css
    └── js
        ├── foo.js
        └── bar.js
```
