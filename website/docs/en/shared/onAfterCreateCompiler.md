`onAfterCreateCompiler` is a callback function that is triggered after the compiler instance has been created, but before the build process. This hook is called when you run `rsbuild.startDevServer`, `rsbuild.build`, or `rsbuild.createCompiler`.

You can access the [Compiler instance](https://webpack.js.org/api/node/#compiler-instance) through the `compiler` parameter:

- **Type:**

```ts
function OnAfterCreateCompiler(callback: (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;): void;
```
