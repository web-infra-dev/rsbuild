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

### React Related

Plugins available for the React framework:

- [React Plugin](/plugins/list/plugin-react): Provides support for React.
- [Svgr Plugin](/plugins/list/plugin-svgr): Support convert SVG to React components.
- [Styled Components Plugin](/plugins/list/plugin-styled-components): Provides compile-time support for styled-components.

### Vue Related

Plugins available for the Vue framework:

- [Vue Plugin](/plugins/list/plugin-vue): Provides support for Vue 3 SFC (Single File Components).
- [Vue JSX Plugin](/plugins/list/plugin-vue-jsx): Provides support for Vue 3 JSX / TSX syntax.
- [Vue2 Plugin](/plugins/list/plugin-vue2): Provides support for Vue 2 SFC (Single File Components).
- [Vue2 JSX Plugin](/plugins/list/plugin-vue2-jsx): Provides support for Vue 2 JSX / TSX syntax.

### Svelte Related

Plugins available for the Svelte framework:

- [Svelte Plugin](/plugins/list/plugin-svelte): Provides support for Svelte components (`.svelte` files).

### Common

The following are common framework-agnostic plugins:

- [Assets Retry Plugin](/plugins/list/plugin-assets-retry): Used to automatically resend requests when static assets fail to load.
- [Babel Plugin](/plugins/list/plugin-babel): Provides support for Babel transpilation capabilities.
- [Type Check Plugin](/plugins/list/plugin-type-check): Used to run TypeScript type checker on a separate process.
- [Image Compress Plugin](/plugins/list/plugin-image-compress): Compress the image resources used in the project.
- [Node Polyfill Plugin](/plugins/list/plugin-node-polyfill): Used to inject polyfills of Node core modules in the browser side.
- [Source Build Plugin](/plugins/list/plugin-source-build): This plugin is designed for the monorepo scenario. It supports referencing source code from other subdirectories and performs build and hot update.
- [Stylus Plugin](/plugins/list/plugin-stylus): Use Stylus as the CSS preprocessor.
- [Check Syntax Plugin](/plugins/list/plugin-check-syntax): Used to analyze the syntax compatibility of artifacts, to see if there are any advanced syntaxes that may cause compatibility issues.
- [CSS Minimizer Plugin](/plugins/list/plugin-css-minimizer): Used to customize CSS minimizer, switch to [cssnano] or other tools for CSS compression.
- [Pug Plugin](/plugins/list/plugin-pug): Provides support for the Pug template engine.

:::tip
You can find the source code of all official plugins in the [web-infra-dev/rsbuild](https://github.com/web-infra-dev/rsbuild) repository.
:::
