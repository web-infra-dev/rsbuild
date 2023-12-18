# CSS Usage

Rsbuild has built-in multiple style resource processing capabilities, including Less / Sass preprocessor, PostCSS, CSS Modules, CSS inline and CSS compression.

In addition, Rsbuild also provides multiple configs to customize the compile rules of style resources.

## Using Less, Sass and Stylus

The Rsbuild has built-in community popular CSS preprocessors such as Less, Sass.

By default, you don't need to configure anything for Less and Sass. If you need to customize loader config, you can configure [tools.less](/config/tools/less), [tools.sass](/config/tools/sass) to set it up.

You can also use Stylus in Rsbuild, just install the Stylus plugin provided by Rsbuild, please refer to [Stylus Plugin](/plugins/list/plugin-stylus) for usage.

## Using PostCSS

Rsbuild has built-in [PostCSS](https://postcss.org/) to transform the CSS code. You can configure PostCSS in the following ways:

1. Rsbuild uses [postcss-load-config](https://github.com/postcss/postcss-load-config) to load the PostCSS configuration file in the root directory of the current project, such as `postcss.config.js`:

```js
module.exports = {
  'postcss-px-to-viewport': {
    viewportWidth: 375,
  },
};
```

2. Configure the postcss-loader through Rsbuild's [tools.postcss](/config/tools/postcss) option, which supports modifying the built-in configuration through a function, for example:

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

When you configure both the `postcss.config.js` file and the `tools.postcss` option, both will take effect, and the `tools.postcss` option will take precedence.

### Builtin PostCSS plugins

Rsbuild has some builtin PostCSS plugins, which will perform the following transformations on CSS:

- [autoprefixer](https://github.com/postcss/autoprefixer): we have enabled [autoprefixer](https://github.com/postcss/autoprefixer) to add vendor prefixes to CSS rules. If you want to configure the target browser, you can use [browserslist](/guide/advanced/browserslist).
- [postcss-flexbugs-fixes](https://npmjs.com/package/postcss-flexbugs-fixes): Used to fix known [Flex Bugs](https://github.com/philipwalton/flexbugs).

## Using CSS Modules

Please read the [Using CSS Modules](/guide/basic/css-modules) chapter for a complete usage of CSS Modules.

## CSS Minify

During the production build, Rsbuild compresses static assets such as CSS and JS to provide better transmission efficiency.

Rsbuild by default uses the built-in `SwcCssMinimizerRspackPlugin` plugin from Rspack to automatically compress CSS code during production builds.

You can customize the CSS minimizer by using the [CSS Minimizer plugin](/plugins/list/plugin-css-minimizer) to switch to cssnano or other tools for CSS compression.

## Inline CSS Files

By default, Rsbuild will extract CSS into a separate `.css` file and output it to the dist directory.

If you want to inline styles into your JS file, you can set [output.injectStyles](/config/output/inject-styles) to true to disable CSS extraction logic. When the JS file is requested by the browser, JS dynamically inserts the `<style>` tag into the Html to load the CSS styles.

```ts
export default {
  output: {
    injectStyles: true,
  },
};
```

This will increase the size of your JS Bundle, so it is usually not recommended to disable the CSS extraction.

## Import CSS in node_modules

You can directly import CSS files in node_modules.

- Import in a component:

```ts title="src/App.tsx"
// Import the Arco Design style:
import '@arco-design/web-react/dist/css/arco.css';
```

- Import in a style file:

```css title="src/App.css"
/* reference normalize.css */
/* https://github.com/necolas/normalize.css */
@import 'normalize.css';

body {
  /* */
}
```
