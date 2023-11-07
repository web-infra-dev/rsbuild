# 引用样式资源

Rsbuild 内置多种常用的样式资源处理方式，包括 Less / Sass 预处理器、PostCSS、CSS Modules、CSS 内联和 CSS 压缩。

除此之外，Rsbuild 也提供了多个配置项来自定义样式资源的处理规则。

## 使用 Less、Sass 和 Stylus

Rsbuild 内置了社区流行的 CSS 预处理器，包括 Less 和 Sass。

默认情况下，你不需要对 Less 和 Sass 进行任何配置。如果你有自定义 loader 配置的需求，可以通过配置 [tools.less](/config/options/tools.html#toolsless)、[tools.sass](/config/options/tools.html#toolssass) 来进行设置。

你也可以在 Rsbuild 中使用 Stylus，只需要安装 Rsbuild 提供的 Stylus 插件即可，使用方式请参考 [Stylus 插件](/plugins/list/plugin-stylus)。

## 使用 PostCSS

Rsbuild 内置了 [PostCSS](https://postcss.org/) 来转换 CSS 代码。你可以通过 [tools.postcss](/config/options/tools.html#toolspostcss) 来配置 postcss-loader。

```ts
export default {
  tools: {
    postcss: (opts) => {
      const viewportPlugin = require('postcss-px-to-viewport')({
        viewportWidth: 375,
      });
      opts.postcssOptions.plugins.push(viewportPlugin);
    },
  },
};
```

### 内置 PostCSS 插件

Rsbuild 内置了一些 PostCSS 插件，会对 CSS 进行以下转换：

- [autoprefixer](https://github.com/postcss/autoprefixer)：在默认情况下，我们开启了 autoprefixer 来自动补齐 CSS 的浏览器前缀。如果你需要配置目标浏览器，可以使用 [browserslist](/guide/advanced/browserslist) 进行配置。
- [postcss-flexbugs-fixes](https://www.npmjs.com/package/postcss-flexbugs-fixes)：用于修复已知的 [Flex Bugs](https://github.com/philipwalton/flexbugs)。

## 使用 CSS Modules

请阅读 [使用 CSS Modules](/guide/basic/css-modules) 章节来了解 CSS Modules 的完整用法。

## CSS 压缩

在生产环境构建时， Rsbuild 会将 CSS、JS 等静态资源进行压缩，以达到更好的传输效率。

Rsbuild 默认使用 Rspack 内置的 `SwcCssMinimizerRspackPlugin` 插件，在生产环境构建时自动压缩 CSS 代码。

你可以通过 [CSS Minimizer 插件](/plugins/list/plugin-css-minimizer) 来自定义 CSS 压缩工具，切换到 cssnano 或其他工具进行 CSS 压缩。

## 内联 CSS 文件

默认情况下，Rsbuild 会把 CSS 提取为独立的 `.css` 文件，并输出到构建产物目录。

如果你希望将样式内联到 JS 文件中，可以将 [output.disableCssExtract](/config/options/output.html#outputdisablecssextract) 设置为 `true` 来禁用 CSS 提取逻辑。当浏览器请求到 JS 文件后，JS 将动态地向 HTML 插入 `<style>` 标签，以此加载 CSS 样式。

```ts
export default {
  output: {
    disableCssExtract: true,
  },
};
```

这将会增大你的 JS Bundle 体积，因此通常情况下，不太建议禁用 CSS 提取逻辑。

## 引用 node_modules 里的样式

你可以直接引用 node_modules 里的样式文件。

- 在组件中引用：

```ts title="src/App.tsx"
// 引用 Arco Design 样式：
import '@arco-design/web-react/dist/css/arco.css';
```

- 在样式文件中引用：

```css title="src/App.css"
/* 引用 normalize.css */
/* https://github.com/necolas/normalize.css */
@import 'normalize.css';

body {
  /* */
}
```
