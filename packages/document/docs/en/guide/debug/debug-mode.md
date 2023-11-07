# Debug Mode

Rsbuild provides a debug mode to troubleshoot problems, you can add the `DEBUG=rsbuild` environment variable when executing a build to enable Rsbuild's debug mode.

```bash
# Debug development environment
DEBUG=rsbuild pnpm dev

# Debug production environment
DEBUG=rsbuild pnpm build
```

In debug mode, Rsbuild will output some additional log information, and write the Rsbuild config and Rspack config to the dist directory, which is convenient for developers to view and debug.

## Log Information

In debug mode, you will see some additional information output from the shell, among which are some process logs starting with `debug`, indicating what operations are performed inside the Rsbuild.

```bash
$ DEBUG=rsbuild pnpm dev

debug create context [1842.90 ms]
debug add default plugins [1874.45 ms]
debug add default plugins done [1938.57 ms]
debug init plugins [2388.29 ms]
debug init plugins done [2389.48 ms]
...
```

In addition, the following logs will be output in the Shell, indicating that the Rsbuild has written the internally generated build configs to disk, and you can open these config files to view the corresponding content.

```bash
Inspect config succeeds, open following files to view the content:

   - Rsbuild Config: /Project/demo/dist/rsbuild.config.js
   - Rspack Config (web): /Project/demo/dist/rspack.config.web.js
```

## Rsbuild Config File

In debug mode, Rsbuild will automatically generate `dist/rsbuild.config.js` file, which contains the final generated Rsbuild config. In this file, you can know the final result of the Rsbuild config you passed in after being processed by the framework and Rsbuild.

The structure of the file is as follows:

```js
module.exports = {
  dev: {
    // some configs...
  },
  source: {
    // some configs...
  },
  // other configs...
};
```

For a complete introduction to Rsbuild config, please see the [Rsbuild Config](/guide/basic/config) chapter.

## Rspack Config File

If the current project is built using Rspack, then in debug mode, Rsbuild will also automatically generate `dist/rspack.config.web.js` file, which contains the final generated Rspack config. In this file, you can see what is included in the config that Rsbuild finally passes to Rspack.

The structure of the file is as follows:

```js
module.exports = {
  resolve: {
    // some resolve configs...
  },
  module: {
    // some Rspack loaders...
  },
  plugins: [
    // some Rspack plugins...
  ],
  // other configs...
};
```

For a complete introduction to Rspack configs, please see [Rspack official documentation](https://rspack.dev/config/).

## Webpack Config File

If the current project is built using webpack, then in debug mode, Rsbuild will also automatically generate `dist/webpack.config.web.js` file, which contains the final generated webpack config. In this file, you can see what is included in the config that Rsbuild finally passes to webpack.

The structure of the file is as follows:

```js
module.exports = {
  resolve: {
    // some resolve configs...
  },
  module: {
    // some webpack loaders...
  },
  plugins: [
    // some webpack plugins...
  ],
  // other configs...
};
```

In addition, if the project configures additional build targets, such as enabling the SSR capability of the framework (corresponding to additional Node.js build target), an additional `webpack.config.node.js` file will be generated in the `dist` directory, corresponding to the webpack config for SSR bundles.

For a complete introduction to webpack configs, please see [webpack official documentation](https://webpack.js.org/concepts/config/).
