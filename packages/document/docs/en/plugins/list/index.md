# Plugin List

## Universal Plugins

The following are universal plugins that can be used in Rspack mode and Webpack mode of Rsbuild:

- [@rsbuild/plugin-vue](/plugins/list/plugin-vue.html): Used to compile Vue 3 SFC (Single File Components).
- [@rsbuild/plugin-vue-jsx](/plugins/list/plugin-vue-jsx.html): Used to compile Vue 3 JSX / TSX syntax.
- [@rsbuild/plugin-vue2](/plugins/list/plugin-vue2.html): Used to build Vue 2 SFC (Single File Components).
- [@rsbuild/plugin-stylus](/plugins/list/plugin-stylus.html): Use Stylus add CSS preprocessor.
- [@rsbuild/plugin-node-polyfill](/plugins/list/plugin-node-polyfill.html): Inject Polyfills of Node core modules in the browser side.
- [@rsbuild/plugin-image-compress](/plugins/list/plugin-image-compress.html): Compress the image resources used in the project.

## Other Plugins

The following are plugins that can only be used in the Webpack mode of Rsbuild, and are not required in Rspack mode.

- [@rsbuild/plugin-swc](/plugins/list/plugin-swc.html): Use SWC as the transformer and minimizer to improve the build performance of Webpack mode.
- [@rsbuild/plugin-esbuild](/plugins/list/plugin-esbuild.html): Use esbuild as the transformer and minimizer to improve the build performance of Webpack mode.

> You can find the source code of all official plugins in the [web-infra-dev/rsbuild](https://github.com/web-infra-dev/rsbuild) repository.
