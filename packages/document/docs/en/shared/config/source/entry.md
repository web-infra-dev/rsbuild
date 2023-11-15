- **Type:**

```ts
type Entry = Record<string, string | string[]>;
```

- **Default:**

```ts
const defaultEntry = {
  index: 'src/index.(ts|js|tsx|jsx|mjs|cjs)',
};
```

Used to set the entry modules for building, the usage is the as same the [entry](https://rspack.dev/config/entry) option in Rspack.

- **Example:**

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
