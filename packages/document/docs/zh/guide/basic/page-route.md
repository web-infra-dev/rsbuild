# 页面路由

本章节介绍了如何在本地开发和预览时进行页面访问。

### 默认情况

Rsbuild Server 会根据 [source.entry](/config/options/source#sourceentry) 配置生成对应的页面路由。

当 entry 为 index 时，可通过 `/` 访问页面；当 entry 为 foo 时，可通过 `/foo` 访问该页面。

```ts title="rsbuild.config.ts"
export default {
  source: {
    entry: {
      index: './src/index.ts',
      foo: './src/pages/foo/index.ts',
    },
  },
};
```

### 默认 Fallback 逻辑

当请求满足以下条件且未找到对应资源时，会被 `server.htmlFallback` 处理，默认会回退到 index.html。

- 当前请求是 GET 或 HEAD 请求
- 当前请求头接受 `text/html` (请求头 accept 类型为 `text/html` 或 `*/*`)

```ts title=rsbuild.config.ts
export default {
  server: {
    htmlFallback: 'index',
  },
};
```

#### 自定义 Fallback 逻辑

当 Rsbuild 默认的 [server.htmlFallback](/config/options/server#serverhtmlfallback) 配置无法满足你的需求，例如，希望在访问 `/` 时可以访问 `main.html`，可通过 [server.historyApiFallback](/config/options/server#serverhistoryapifallback) 进行设置。

```ts title=rsbuild.config.ts
export default {
  source: {
    entry: {
      main: './src/index.ts',
    },
  },
  server: {
    htmlFallback: false,
    historyApiFallback: {
      index: '/main.html',
    },
  },
};
```

### HTML 文件输出位置与路由的关系

通常情况下，`/` 指向 dist 产物根目录， 而 HTML 文件输出到 dist 根目录下，此时可通过 `/xxx` 访问对应的 HTML 页面。

若通过修改 [output.distPath.html](/config/options/output#outputdistpath) 将 HTML 文件输出到其他子目录下，此时需通过 `/[htmlPath]/xxx` 访问对应的 HTML 页面。

例如，设置将 HTML 文件输出到 `HTML` 目录下，此时将通过 `/html/` 访问到 index.html，通过 `/html/foo` 访问到 foo.html。

```
export default {
  source: {
    entry: {
      index: './src/index.ts',
      foo: './src/pages/foo/index.ts',
    },
  },
  output: {
    distPath: {
      html: 'html',
    },
  },
};
```
