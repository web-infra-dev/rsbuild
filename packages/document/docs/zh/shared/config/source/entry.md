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

用于设置构建的入口模块，用法与 Rspack 的 [entry](https://rspack.dev/config/entry) 选项一致。

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
