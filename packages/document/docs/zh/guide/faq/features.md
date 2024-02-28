# 功能类问题

### 如何配置组件库按需引入？

如果需要配置组件库的按需引入，你可以通过 [source.transformImport](/config/source/transform-import) 配置，这个配置的能力等价于 [babel-plugin-import](https://npmjs.com/package/babel-plugin-import)。

```ts
export default {
  source: {
    transformImport: [
      {
        libraryName: 'xxx-components',
        libraryDirectory: 'es',
        style: true,
      },
    ],
  },
};
```

---

### 如何在编译过程中进行 ESLint 代码校验？

出于编译性能的考虑，Rsbuild 默认不会在编译过程中进行 ESLint 校验，如果你需要该功能，可以使用 Rsbuild 的 [ESLint 插件](/plugins/list/plugin-eslint)。

---

### 如何配置静态资源的 CDN 路径？

如果需要将 JS、CSS 等静态资源上传到 CDN 使用，那么可以通过 [output.assetPrefix](/config/output/asset-prefix) 配置来设置静态资源的 URL 前缀。

```js
export default {
  output: {
    assetPrefix: 'https://cdn.example.com/assets/',
  },
};
```

---

### 如何移除代码中的 console？

在生产环境构建时，我们可以移除代码中的 `console`，从而避免开发环境的日志被输出到生产环境。

Rsbuild 默认提供了移除 console 的配置项，请查看 [performance.removeConsole](/config/performance/remove-console)。

---

### 如何查看 Rsbuild 生成的 Rspack 配置?

通过 Rsbuild 调试模式可以查看 Rsbuild 生成的 Rspack 配置。

你可以在执行构建时添加 `DEBUG=rsbuild` 环境变量，即可开启 Rsbuild 的[调试模式](/guide/debug/debug-mode)，此时会输出内部生成的 Rspack 配置到 dist 目录下。

```bash
➜ DEBUG=rsbuild pnpm dev

debug   create context [1842.90 ms]
debug   add default plugins [1874.45 ms]
debug   add default plugins done [1938.57 ms]
...

Inspect config succeed, open following files to view the content:

  - Rsbuild Config: /root/my-project/dist/rsbuild.config.mjs
  - Rspack Config (web): /root/my-project/dist/rspack.config.web.mjs
```

---

### 如何忽略特定 warning 日志？

默认情况下，Rsbuild 会打印构建过程产生的所有 error 和 warning 日志。

如果遇到由于三方包产生大量 warning 日志，暂时又无法处理，希望忽略的情况。可通过 Rspack 提供的 `ignoreWarnings` 配置忽略特定 warning 日志。

```ts
export default {
  tools: {
    bundlerChain: (chain) => {
      chain.ignoreWarnings([/Using \/ for division outside of calc()/]);
    },
  },
};
```

详细信息可参考: [ignoreWarnings](https://webpack.js.org/configuration/other-options/#ignorewarnings)。
