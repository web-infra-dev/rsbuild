在启动生产预览服务器后调用，你可以通过 `port` 参数获得生产服务器监听的端口号，通过 `routes` 获得页面路由信息。

- **类型：**

```ts
type Routes = Array<{
  entryName: string;
  pathname: string;
}>;

function OnAfterStartProdServer(
  callback: (params: { port: number; routes: Routes }) => Promise<void> | void,
): void;
```
