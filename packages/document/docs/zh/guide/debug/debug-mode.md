# 开启调试模式

为了便于排查问题，Rsbuild 提供了调试模式，你可以在执行构建时添加 `DEBUG=rsbuild` 环境变量来开启 Rsbuild 的调试模式。

```bash
# 调试开发环境
DEBUG=rsbuild pnpm dev

# 调试生产环境
DEBUG=rsbuild pnpm build
```

在调试模式下，Rsbuild 会输出一些额外的日志信息，并将内部最终生成的 Rsbuild 配置和 Rspack 配置写入到产物目录下，便于开发者查看和调试。

## 日志信息

在调试模式下，你会看到 Shell 中输出了一些额外的信息，其中以 `debug` 开头的是一些流程日志，表明 Rsbuild 内部执行了哪些操作。

```bash
$ DEBUG=rsbuild pnpm dev

debug   create context [1842.90 ms]
debug   add default plugins [1874.45 ms]
debug   add default plugins done [1938.57 ms]
debug   init plugins [2388.29 ms]
debug   init plugins done [2389.48 ms]
...
```

此外，Shell 中还会输出以下日志，表示 Rsbuild 将内部生成的构建配置写入到磁盘中，此时你可以打开这些配置文件来查看相应的内容。

```bash
Inspect config succeed, open following files to view the content:

  - Rsbuild Config: /Project/demo/dist/rsbuild.config.js
  - Rspack Config (web): /Project/demo/dist/rspack.config.web.js
```

## Rsbuild 配置文件

在调试模式下，Rsbuild 会自动生成 `dist/rsbuild.config.js` 文件，这里面包含了最终生成的 Rsbuild 配置。在这个文件里，你可以了解到你传入的 Rsbuild 配置在经过框架层和 Rsbuild 处理后的最终结果。

该文件的大致结构如下：

```js
module.exports = {
  dev: {
    // some configs...
  },
  source: {
    // some configs...
  },
  // other configs...
};
```

关于 Rsbuild 配置项的完整介绍，请查看 [Rsbuild 配置项](/guide/basic/config) 章节。

## Rspack 配置文件

如果当前项目是使用 Rspack 进行构建的，那么在调试模式下，Rsbuild 还会自动生成 `dist/rspack.config.web.js` 文件，这里面包含了最终生成的 Rspack 配置。在这个文件里，你可以了解到 Rsbuild 最终传递给 Rspack 的配置里包含了哪些内容。

该文件的大致结构如下：

```js
module.exports = {
  resolve: {
    // some resolve configs...
  },
  module: {
    // some Rspack loaders...
  },
  plugins: [
    // some Rspack plugins...
  ],
  // other configs...
};
```

关于 Rspack 配置项的完整介绍，请查看 [Rspack 官方文档](https://www.rspack.dev/zh/config)。

## Webpack 配置文件

如果当前项目是使用 webpack 进行构建的，那么在调试模式下，Rsbuild 还会自动生成 `dist/webpack.config.web.js` 文件，这里面包含了最终生成的 webpack 配置。在这个文件里，你可以了解到 Rsbuild 最终传递给 webpack 的配置里包含了哪些内容。

该文件的大致结构如下：

```js
module.exports = {
  resolve: {
    // some resolve configs...
  },
  module: {
    // some webpack loaders...
  },
  plugins: [
    // some webpack plugins...
  ],
  // other configs...
};
```

此外，如果项目配置了额外的构建产物类型，比如开启了框架的 SSR 能力（对应额外的 Node.js 构建产物），在 `dist` 目录会另外生成一份 `webpack.config.node.js` 文件，对应 SSR 构建时的 webpack 配置。

关于 webpack 配置项的完整介绍，请查看 [webpack 官方文档](https://webpack.js.org/concepts/configuration/)。
