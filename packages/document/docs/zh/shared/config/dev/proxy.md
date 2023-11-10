- **类型：** `Record<string, string> | Record<string, ProxyDetail>`
- **默认值：** `undefined`

代理请求到指定的服务上。

```js
export default {
  dev: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
};
```

此时，/api/users 请求将会代理到 http://localhost:3000/api/users。

如果你不想传递 /api，可以通过 `pathRewrite` 重写请求路径：

```js
export default {
  dev: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        pathRewrite: { '^/api': '' },
      },
    },
  },
};
```

DevServer Proxy 基于 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware/tree/2.x) 实现。你可以使用 http-proxy-middleware 的所有配置项，具体可以查看文档。

DevServer Proxy 完整类型定义为：

```ts
import type { Options as HttpProxyOptions } from 'http-proxy-middleware';

type ProxyDetail = HttpProxyOptions & {
  bypass?: (
    req: IncomingMessage,
    res: ServerResponse,
    proxyOptions: ProxyOptions,
  ) => string | undefined | null | false;
  context?: string | string[];
};

type ProxyOptions =
  | Record<string, string>
  | Record<string, ProxyDetail>
  | ProxyDetail[]
  | ProxyDetail;
```

除了 http-proxy-middleware 的选项外，还支持 bypass 和 context 两个配置项：

- bypass：根据函数的返回值绕过代理。
  - 返回 `null` 或 `undefined` 会继续用代理处理请求。
  - 返回 `false` 会返回 404 错误。
  - 返回一个具体的服务路径，将会使用此路径替代原请求路径。
- context：如果你想代理多个特定的路径到同一个目标，你可以使用 context 配置项。

```js
// 自定义 bypass 方法
export default {
  dev: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        bypass: function (req, res, proxyOptions) {
          if (req.headers.accept.indexOf('html') !== -1) {
            console.log('Skipping proxy for browser request.');
            return '/index.html';
          }
        },
      },
    },
  },
};
```

```js
// 代理多个路径到同一个目标
export default {
  dev: {
    proxy: [
      {
        context: ['/auth', '/api'],
        target: 'http://localhost:3000',
      },
    ],
  },
};
```
