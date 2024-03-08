`onAfterBuild` is a callback function that is triggered after running the production build. You can access the build result information via the `stats' parameter:

- If the current bundler is Rspack, you will get Rspack Stats.
- If the current bundler is webpack, you will get webpack Stats.

Moreover, you can use `isFirstCompile` to determine whether it is the first build on watch mode.

- **Type:**

```ts
function OnAfterBuild(
  callback: (params: { isFirstCompile: boolean, stats?: Stats | MultiStats }) => Promise<void> | void,
): void;
```
