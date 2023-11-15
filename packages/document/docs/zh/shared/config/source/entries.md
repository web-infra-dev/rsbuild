- **类型：**

```ts
type Entries = Record<string, string | string[]>;
```

- **默认值：**

```ts
const defaultEntry = {
  index: 'src/index.(js|ts|jsx|tsx)',
};
```

用于设置构建的入口模块，用法与 Rspack 的 [entry](https://rspack.dev/config/entry) 选项一致。

- **示例：**

```ts
export default {
  source: {
    entries: {
      foo: './src/pages/foo/index.ts',
      bar: './src/pages/bar/index.ts',
    },
  },
};
```
