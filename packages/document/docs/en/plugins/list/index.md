# Plugin List

## Universal Plugins

The following are universal plugins that can be used in Rspack mode and Webpack mode of Rsbuild:

### [React Plugin](/plugins/list/plugin-react.html)

Provides support for React.

### [Vue Plugin](/plugins/list/plugin-vue.html)

Provides support for Vue 3 SFC (Single File Components).

### [Vue JSX Plugin](/plugins/list/plugin-vue-jsx.html)

Provides support for Vue 3 JSX / TSX syntax.

### [Vue2 Plugin](/plugins/list/plugin-vue2.html)

Provides support for Vue 2 SFC (Single File Components).

### [Vue2 JSX Plugin](/plugins/list/plugin-vue2-jsx.html)

Provides support for Vue 2 JSX / TSX syntax.

### [Type Check Plugin](/plugins/list/plugin-type-check.html)

Used to run TypeScript type checker on a separate process.

### [Image Compress Plugin](/plugins/list/plugin-image-compress.html)

Compress the image resources used in the project.

### [Node Polyfill Plugin](/plugins/list/plugin-node-polyfill.html)

Used to inject polyfills of Node core modules in the browser side.

### [Source Build Plugin](/plugins/list/plugin-source-build.html)

This plugin is designed for the monorepo scenario. It supports referencing source code from other subdirectories and performs build and hot update.

### [Stylus Plugin](/plugins/list/plugin-stylus.html)

Use Stylus add CSS preprocessor.

## Other Plugins

The following are plugins that can only be used in the Webpack mode of Rsbuild, and are not required in Rspack mode.

### [SWC Plugin](/plugins/list/plugin-swc.html)

Use SWC as the transformer and minimizer to improve the build performance of Webpack mode.

### [esbuild Plugin](/plugins/list/plugin-esbuild.html)

Use esbuild as the transformer and minimizer to improve the build performance of Webpack mode.

> You can find the source code of all official plugins in the [web-infra-dev/rsbuild](https://github.com/web-infra-dev/rsbuild) repository.
