在启动生产预览服务器后调用，你可以通过 `port` 参数获得生产服务器监听的端口号。

- **类型：**

```ts
function OnAfterStartProdServer(
  callback: (params: { port: number }) => Promise<void> | void,
): void;
```
