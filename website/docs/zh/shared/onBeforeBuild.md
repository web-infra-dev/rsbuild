`onBeforeBuild` 是在执行生产环境构建前触发的回调函数。

你可以通过 `bundlerConfigs` 参数获取到 Rspack 配置数组，数组中可能包含一份或多份 [Rspack 配置](https://rspack.dev/config.html)，这取决于 Rsbuild [output.targets](/config/output/targets) 配置的值。

- **类型：**

```ts
function OnBeforeBuild(
  callback: (params: {
    bundlerConfigs?: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
