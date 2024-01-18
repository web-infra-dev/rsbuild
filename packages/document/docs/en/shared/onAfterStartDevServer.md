Called after starting the development server, you can get the port number with the `port` parameter, and the page routes info with the `routes`.

- **Type:**

```ts
type Routes = Array<{
  entryName: string;
  pathname: string;
}>;

function OnAfterStartDevServer(
  callback: (params: { port: number; routes: Routes }) => Promise<void> | void,
): void;
```
