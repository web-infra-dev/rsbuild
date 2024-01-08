# Plugin List

## Plugin System

You can read about the functionality of Rsbuild plugins and how to develop an Rsbuild plugin in the [Plugin System](/plugins/dev/index) documentation.

## Using Plugins

You can register Rsbuild plugins in the `rsbuild.config.ts` file using the `plugins` option. For more details, refer to [plugins](/config/plugins).

If you are using Rsbuild's JavaScript API, you can register the plugin using the [addPlugins](/api/javascript-api/instance#rsbuildaddplugins) method.

## Official Plugins

The following are official plugins that can be used in Rsbuild.

### For React

Plugins available for the React framework:

- [React Plugin](/plugins/list/plugin-react): Provides support for React.
- [SVGR Plugin](/plugins/list/plugin-svgr): Support convert SVG to React components.
- [Styled Components Plugin](/plugins/list/plugin-styled-components): Provides compile-time support for styled-components.

### For Vue

Plugins available for the Vue framework:

- [Vue Plugin](/plugins/list/plugin-vue): Provides support for Vue 3 SFC (Single File Components).
- [Vue JSX Plugin](/plugins/list/plugin-vue-jsx): Provides support for Vue 3 JSX / TSX syntax.
- [Vue2 Plugin](/plugins/list/plugin-vue2): Provides support for Vue 2 SFC (Single File Components).
- [Vue2 JSX Plugin](/plugins/list/plugin-vue2-jsx): Provides support for Vue 2 JSX / TSX syntax.

### For Svelte

Plugins available for the Svelte framework:

- [Svelte Plugin](/plugins/list/plugin-svelte): Provides support for Svelte components (`.svelte` files).

### For Solid

Plugins available for the Solid framework:

- [Solid Plugin](/plugins/list/plugin-solid): Provides support for Solid.

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
- [CSS Minimizer Plugin](/plugins/list/plugin-css-minimizer): Used to customize CSS minimizer, switch to [cssnano](https://cssnano.co/) or other tools for CSS compression.
- [Pug Plugin](/plugins/list/plugin-pug): Provides support for the Pug template engine.
- [Rem Plugin](/plugins/list/plugin-rem): Implements the rem adaptive layout for mobile pages.
- [UMD Plugin](/plugins/list/plugin-umd): Used to build outputs in UMD format.
- [YAML Plugin](/plugins/list/plugin-yaml): Used to import YAML files and convert them into JavaScript objects.
- [TOML Plugin](/plugins/list/plugin-toml): Used to import TOML files and convert them into JavaScript objects.

:::tip
You can find the source code of all official plugins in the [web-infra-dev/rsbuild](https://github.com/web-infra-dev/rsbuild) repository.
:::
