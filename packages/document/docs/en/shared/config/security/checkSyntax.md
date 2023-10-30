- **Type:**

```ts
type CheckSyntax =
  | boolean
  | {
      targets?: string[];
      exclude?: RegExp | RegExp[];
      ecmaVersion?: EcmaVersion;
    };
```

- **Default:** `false`

### Solutions

If a syntax error is detected, you can handle it in the following ways:

- If you want to downgrade this syntax to ensure good code compatibility, you can compile the corresponding module through the `source.include` config.
- If you don't want to downgrade the syntax, you can adjust the project's browserslist to match the syntax.
- If you do not want to check the syntax of certain products, you can use the `checkSyntax.exclude` configuration to exclude the files to be checked.
