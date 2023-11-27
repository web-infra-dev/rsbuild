- **Type:**

```ts
type PrintFileSizeOptions =
  | {
      /**
       * whether to print total size
       */
      total?: boolean;
      /**
       * whether to print size of each file
       */
      detail?: boolean;
    }
  | boolean;
```

- **Default:** `true`

Whether to print the file sizes after production build.

If it is a Boolean type, it will be decided according to the config whether to print the file sizes. The default output is as follows.

```bash
info    Production file sizes:

  File                                    Size        Gzipped
  dist/static/js/lib-react.b0714b60.js    140.4 kB    45.0 kB
  dist/static/js/index.f3fde9c7.js        1.9 kB      0.97 kB
  dist/index.html                         0.39 kB     0.25 kB
  dist/static/css/index.2960ac62.css      0.35 kB     0.26 kB

  Total size:  143.0 kB
  Gzipped size:  46.5 kB
```

You can also configure whether to print the sum of the size of all static resource files and whether to print the size of each static resource file through the Object type.

If you don't want to print the size of each static resource file, you can:

```ts
export default {
  performance: {
    printFileSize: {
      detail: false,
    },
  },
};
```

If you don't want to print any information, you can disable it by setting `printFileSize` to `false`:

```ts
export default {
  performance: {
    printFileSize: false,
  },
};
```
