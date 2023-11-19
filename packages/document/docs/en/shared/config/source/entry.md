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

Used to set the entry modules for building.

The usage of `source.entry` is similar to the `entry` option in [Rspack](https://rspack.dev/config/entry). The main difference is that Rsbuild will register [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) for each entry in `source.entry` to generate the corresponding HTML files.

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

The generated directory structure is as follows:

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
