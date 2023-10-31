# Plugin List

## Using Plugins

You can register Rsbuild plugins using the `plugins` option in `rsbuild.config.ts`.

For example, to register a Vue plugin:

```ts title="rsbuild.config.ts"
import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

export default defineConfig({
  plugins: [pluginVue()],
});
```

## Official Plugins

The following are official plugins that can be used in Rsbuild.

### [React Plugin](/plugins/list/plugin-react.html)

Provides support for React.

### [Svgr Plugin](/plugins/list/plugin-svgr.html)

Support convert SVG to React components.

### [Vue Plugin](/plugins/list/plugin-vue.html)

Provides support for Vue 3 SFC (Single File Components).

### [Vue JSX Plugin](/plugins/list/plugin-vue-jsx.html)

Provides support for Vue 3 JSX / TSX syntax.

### [Vue2 Plugin](/plugins/list/plugin-vue2.html)

Provides support for Vue 2 SFC (Single File Components).

### [Vue2 JSX Plugin](/plugins/list/plugin-vue2-jsx.html)

Provides support for Vue 2 JSX / TSX syntax.

### [Babel Plugin](/plugins/list/plugin-babel.html)

Provides support for Babel transpilation capabilities.

### [Type Check Plugin](/plugins/list/plugin-type-check.html)

Used to run TypeScript type checker on a separate process.

### [Image Compress Plugin](/plugins/list/plugin-image-compress.html)

Compress the image resources used in the project.

### [Node Polyfill Plugin](/plugins/list/plugin-node-polyfill.html)

Used to inject polyfills of Node core modules in the browser side.

### [Source Build Plugin](/plugins/list/plugin-source-build.html)

This plugin is designed for the monorepo scenario. It supports referencing source code from other subdirectories and performs build and hot update.

### [Stylus Plugin](/plugins/list/plugin-stylus.html)

Use Stylus as the CSS preprocessor.

### [Check Syntax Plugin](/plugins/list/plugin-check-syntax.html)

Used to analyze the syntax compatibility of artifacts, to see if there are any advanced syntaxes that may cause compatibility issues.

### [Styled Components Plugin](/plugins/list/plugin-styled-components.html)

Provides compile-time support for styled-components.

> You can find the source code of all official plugins in the [web-infra-dev/rsbuild](https://github.com/web-infra-dev/rsbuild) repository.
