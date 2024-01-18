Called after starting the production preview server, you can get the port number through the `port` parameter, and the page routes info with the `routes`.

- **Type:**

```ts
type Routes = Array<{
  entryName: string;
  pathname: string;
}>;

function OnAfterStartProdServer(
  callback: (params: { port: number; routes: Routes }) => Promise<void> | void,
): void;
```
