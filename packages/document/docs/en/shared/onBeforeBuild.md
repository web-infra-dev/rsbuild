`onBeforeBuild` is a callback function that is triggered before the production build is executed.

You can access the Rspack configuration array through the `bundlerConfigs` parameter. The array may contain one or more [Rspack configurations](https://rspack.dev/config.html), depending on the value of the Rsbuild's [output.targets](/config/output/targets) configuration.

- **Type:**

```ts
function OnBeforeBuild(
  callback: (params: {
    bundlerConfigs?: WebpackConfig[] | RspackConfig[];
  }) => Promise<void> | void,
): void;
```
