# 开发服务器

Rsbuild 配备了一个内置的开发服务器，旨在提升开发体验。当你执行 `rsbuild dev` 或 `rsbuild preview` 命令时，该服务器将启动，并提供页面预览、路由、模块热更新等功能。

## 页面路由

Rsbuild 的 Server 提供一套默认的路由约定，并允许用户通过配置项定制。

### 默认行为

Rsbuild Server 会根据 [source.entry](/config/source/entry) 配置生成对应的页面路由。

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

### Fallback 行为

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

### 自定义 Fallback 行为

当 Rsbuild 默认的 [server.htmlFallback](/config/server/html-fallback) 配置无法满足你的需求，例如，希望在访问 `/` 时可以访问 `main.html`，可通过 [server.historyApiFallback](/config/server/history-api-fallback) 进行设置。

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

### HTML 输出路径

通常情况下，`/` 指向 dist 产物根目录， 而 HTML 文件输出到 dist 根目录下，此时可通过 `/xxx` 访问对应的 HTML 页面。

若通过修改 [output.distPath.html](/config/output/dist-path) 将 HTML 文件输出到其他子目录下，此时需通过 `/[htmlPath]/xxx` 访问对应的 HTML 页面。

例如，设置将 HTML 文件输出到 `HTML` 目录下，此时将通过 `/html/` 访问到 index.html，通过 `/html/foo` 访问到 foo.html。

```ts
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

## 对比 Rspack Dev Server

Rsbuild 的开发服务器与 Rspack CLI 的开发服务器（`@rspack/dev-server`）有一些异同：

- 两者都是基于 [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) 实现。
- 两者的配置项不同，Rsbuild 提供了更丰富的配置项。
- Rspack CLI 日志格式会与 Webpack CLI 对齐，Rsbuild 的日志则更加清晰和易读。

:::tip
Rsbuild 应用不能使用 Rspack 的 [devServer](https://rspack.dev/config/dev-server) 配置项。你可以通过 Rsbuild 的 `dev` 和 `server` 配置 Server 的行为，详见 [Config 总览](/config/index)。
:::
