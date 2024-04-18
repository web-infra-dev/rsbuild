`onAfterCreateCompiler` 是在创建 Compiler 实例后、执行构建前触发的回调函数，当你执行 `rsbuild.startDevServer`、`rsbuild.build` 或 `rsbuild.createCompiler` 时，都会调用此钩子。

你可以通过 `compiler` 参数获取到 [Compiler 实例对象](https://webpack.js.org/api/node/#compiler-instance):

- **类型：**

```ts
function OnAfterCreateCompiler(callback: (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;): void;
```
