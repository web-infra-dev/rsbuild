# 总览

## 插件系统

你可以阅读 [插件系统](/plugins/dev/index) 来了解 Rsbuild 插件的功能，以及如何开发一个 Rsbuild 插件。

## 使用插件

你可以在 `rsbuild.config.ts` 中通过 `plugins` 选项来注册 Rsbuild 插件，详见 [plugins](/config/plugins)。

如果你使用了 Rsbuild 的 JavaScript API，可以通过 [addPlugins](/api/javascript-api/instance#rsbuildaddplugins) 方法来注册插件。

## 官方插件

以下是 Rsbuild 官方提供的插件。

### React

适用于 React 框架的插件有：

- [React 插件](/plugins/list/plugin-react)：提供对 React 的支持。
- [SVGR 插件](/plugins/list/plugin-svgr)：支持将 SVG 图片转换为一个 React 组件使用。
- [Styled Components 插件](/plugins/list/plugin-styled-components)：提供对 styled-components 的编译时支持。

### Vue

适用于 Vue 框架的插件有：

- [Vue 插件](/plugins/list/plugin-vue)：提供对 Vue 3 SFC（单文件组件）的支持。
- [Vue JSX 插件](/plugins/list/plugin-vue-jsx)：提供对 Vue 3 JSX / TSX 语法的支持。
- [Vue 2 插件](/plugins/list/plugin-vue2)：提供对 Vue 2 SFC（单文件组件）的支持。
- [Vue 2 JSX 插件](/plugins/list/plugin-vue2-jsx)：提供对 Vue 2 JSX / TSX 语法的支持。

### Preact

适用于 Preact 框架的插件有：

- [Preact 插件](/plugins/list/plugin-preact)：提供对 Preact 的支持。

### Svelte

适用于 Svelte 框架的插件有：

- [Svelte 插件](/plugins/list/plugin-svelte)：提供对 Svelte 组件（`.svelte` 文件）的支持。

### Solid

适用于 Solid 框架的插件有：

- [Solid 插件](/plugins/list/plugin-solid)：提供对 Solid 的支持。

### 通用插件

以下是与框架无关的通用插件：

- [Assets Retry 插件](/plugins/list/plugin-assets-retry)：用于在静态资源加载失败时自动发起重试请求。
- [Babel 插件](/plugins/list/plugin-babel)：提供对 Babel 转译能力的支持。
- [Type Check 插件](/plugins/list/plugin-type-check)：用于在单独的进程中运行 TypeScript 类型检查。
- [Image Compress 插件](/plugins/list/plugin-image-compress)：将项目中用到的图片资源进行压缩处理。
- [MDX 插件](/plugins/list/plugin-mdx)：提供 MDX 支持。
- [Node Polyfill 插件](/plugins/list/plugin-node-polyfill)：用于注入 Node 核心模块在浏览器端的 polyfills。
- [Source Build 插件](/plugins/list/plugin-source-build)：用于 monorepo 场景，支持引用其他子目录的源代码，并完成构建和热更新。
- [Stylus 插件](/plugins/list/plugin-stylus)：使用 Stylus 作为 CSS 预处理器。
- [Check Syntax 插件](/plugins/list/plugin-check-syntax)：用于分析产物的语法兼容性，判断是否存在导致兼容性问题的高级语法。
- [CSS Minimizer 插件](/plugins/list/plugin-css-minimizer)：用于自定义 CSS 压缩工具，切换到 [cssnano](https://cssnano.co/) 或其他工具进行 CSS 压缩。
- [Pug 插件](/plugins/list/plugin-pug)：提供对 Pug 模板引擎的支持。
- [Rem 插件](/plugins/list/plugin-rem)：用于实现移动端页面的 rem 自适应布局。
- [UMD 插件](/plugins/list/plugin-umd)：用于构建 UMD 格式的产物。
- [YAML 插件](/plugins/list/plugin-yaml)：用于引用 YAML 文件，并将其转换为 JavaScript 对象。
- [TOML 插件](/plugins/list/plugin-toml)：用于引用 TOML 文件，并将其转换为 JavaScript 对象。

:::tip
你可以在 [web-infra-dev/rsbuild](https://github.com/web-infra-dev/rsbuild) 仓库中找到所有官方插件的源代码。
:::
