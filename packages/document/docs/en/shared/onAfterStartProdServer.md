Called after starting the production preview server, you can get the port number through the `port` parameter.

- **Type:**

```ts
function OnAfterStartProdServer(
  callback: (params: { port: number }) => Promise<void> | void,
): void;
```
