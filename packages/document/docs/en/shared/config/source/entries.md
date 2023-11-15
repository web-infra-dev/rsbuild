- **Type:**

```ts
type Entries = Record<string, string | string[]>;
```

- **Default:**

```ts
const defaultEntry = {
  index: 'src/index.(js|ts|jsx|tsx)',
};
```

Used to set the entry modules for building, the usage is the as same the [entry](https://rspack.dev/config/entry) option in Rspack.

- **Example:**

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
