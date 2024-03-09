`onAfterBuild` 是在执行生产环境构建后触发的回调函数，你可以通过 [stats](https://webpack.js.org/api/node/#stats-object) 参数获取到构建结果信息：

另外，在 watch 模式下你可以通过 `isFirstCompile` 来判断是否为首次构建。

- **类型：**

```ts
function OnAfterBuild(
  callback: (params: {
    isFirstCompile: boolean;
    stats?: Stats | MultiStats;
  }) => Promise<void> | void,
): void;
```
