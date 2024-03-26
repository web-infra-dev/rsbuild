`onAfterBuild` is a callback function that is triggered after running the production build. You can access the build result information via the [stats](https://webpack.js.org/api/node/#stats-object) parameter:

Moreover, you can use `isFirstCompile` to determine whether it is the first build on watch mode.

- **Type:**

```ts
function OnAfterBuild(
  callback: (params: {
    isFirstCompile: boolean;
    stats?: Stats | MultiStats;
  }) => Promise<void> | void,
): void;
```
