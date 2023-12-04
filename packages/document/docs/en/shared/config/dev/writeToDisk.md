- **Type:** `boolean | ((filename: string) => boolean)`
- **Default:** `(file: string) => !file.includes('.hot-update.')`

Used to control whether the build artifacts of the development environment are written to the disk.

By default, Rsbuild will write the build artifacts to the output directory (excluding hot update temporary files). In the development environment, you can choose to save the build artifacts in the memory of the dev server to reduce the overhead of file operations.

You only need to set the `dev.writeToDisk` configuration option to `false`:

```ts
export default {
  dev: {
    writeToDisk: false,
  },
};
```

You can also set `dev.writeToDisk` as a function to match part of the files. When the function returns `false`, it will not write to the disk, and when it returns `true`, it will write the file to the disk.

For example:

```ts
export default {
  dev: {
    writeToDisk: (file) => !file.includes('.hot-update.'),
  },
};
```

:::tip
The `writeToDisk: true` option is used to view the build artifacts in the development environment. It does not change the behavior of webpack-dev-middleware. When accessing files through the browser, the dev server will still read the file content from memory.
:::
