# 总览

## 通用插件

以下是 Rsbuild 的 Rspack 模式和 Webpack 模式下都可以使用的通用插件：

### [@rsbuild/plugin-vue](/plugins/list/plugin-vue.html)

提供对 Vue 3 SFC（单文件组件）的支持。

### [@rsbuild/plugin-vue-jsx](/plugins/list/plugin-vue-jsx.html)

提供对 Vue 3 JSX / TSX 语法的支持。

### [@rsbuild/plugin-vue2](/plugins/list/plugin-vue2.html)

提供对 Vue 2 SFC（单文件组件）的支持。

### [@rsbuild/plugin-vue2-jsx](/plugins/list/plugin-vue2-jsx.html)

提供对 Vue 2 JSX / TSX 语法的支持。

### [@rsbuild/plugin-stylus](/plugins/list/plugin-stylus.html)

使用 Stylus 作为 CSS 预处理器。

### [@rsbuild/plugin-node-polyfill](/plugins/list/plugin-node-polyfill.html)

注入 Node 核心模块在浏览器端的 Polyfills。

### [@rsbuild/plugin-image-compress](/plugins/list/plugin-image-compress.html)

将项目中用到的图片资源进行压缩处理。

## 其他插件

以下是只能在 Rsbuild 的 Webpack 模式下使用的插件，在 Rspack 模式下无须使用。

### [@rsbuild/plugin-swc](/plugins/list/plugin-swc.html)

使用 SWC 进行代码编译和压缩，用于提升 Webpack 模式的构建性能。

### [@rsbuild/plugin-esbuild](/plugins/list/plugin-esbuild.html)

使用 esbuild 进行代码编译和压缩，用于提升 Webpack 模式的构建性能。

> 你可以在 [web-infra-dev/rsbuild](https://github.com/web-infra-dev/rsbuild) 仓库下找到所有官方插件的源代码。
