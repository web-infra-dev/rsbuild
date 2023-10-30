- **类型：**

```ts
type CheckSyntax =
  | boolean
  | {
      targets?: string[];
      exclude?: RegExp | RegExp[];
      ecmaVersion?: EcmaVersion;
    };
```

- **默认值：** `false`
