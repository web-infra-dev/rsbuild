`onAfterBuild` 是在执行生产环境构建后触发的回调函数，你可以通过 `stats` 参数获取到构建结果信息：

- 如果当前打包工具为 Rspack，则获取到的是 Rspack Stats。
- 如果当前打包工具为 webpack，则获取到的是 webpack Stats。

另外，在 watch 模式下你可以通过 `isFirstCompile` 来判断是否为首次构建。

- **类型：**

```ts
function OnAfterBuild(
  callback: (params: { isFirstCompile: boolean, stats?: Stats | MultiStats }) => Promise<void> | void,
): void;
```
