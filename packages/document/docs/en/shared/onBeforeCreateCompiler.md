`onBeforeCreateCompiler` is a callback function that is triggered after the Compiler instance has been created, but before the build process begins. This hook is called when you run `rsbuild.startDevServer`, `rsbuild.build`, or `rsbuild.createCompiler`.

You can access the Compiler instance object through the `compiler` parameter:

- If the current bundler is Rspack, you will get the Rspack Compiler object.
- If the current bundler is webpack, you will get the webpack Compiler object.

- **Type**

```ts
function OnBeforeCreateCompiler(
  callback: (params: {
    bundlerConfigs: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
