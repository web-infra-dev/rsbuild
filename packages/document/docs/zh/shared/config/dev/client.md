- **类型：**

```ts
{
    /** 指定协议名称 */
    protocol?: string;
    /** 事件流路径 */
    path?: string;
    /** 指定监听请求的端口号 */
    port?: string;
    /** 指定要使用的 host */
    host?: string;
}
```

- **默认值：**

```js
const defaultConfig = {
  path: '/webpack-hmr',
  // By default it is set to the port number of the dev server
  port: '',
  // By default it is set to "location.hostname"
  host: '',
  // By default it is set to "location.protocol === 'https:' ? 'wss' : 'ws'""
  protocol: '',
};
```

对应 HMR 客户端的配置，通常用于设置 HMR 对应的 WebSocket URL。
