# Debug Mode

Rsbuild provides a debug mode to troubleshoot problems, you can add the `DEBUG=rsbuild` environment variable when building to enable Rsbuild's debug mode.

```bash
# Debug for development build
DEBUG=rsbuild pnpm dev

# Debug for production build
DEBUG=rsbuild pnpm build
```

In debug mode, Rsbuild will output some additional log information, and write the Rsbuild config and Rspack config to the dist directory, which is convenient for developers to view and debug.

## Log Information

In debug mode, you will see some additional information output from the terminal, among which are some process logs starting with `debug`, indicating what operations are performed inside the Rsbuild.

```bash
$ DEBUG=rsbuild pnpm dev

debug create context [1842.90 ms]
debug add default plugins [1874.45 ms]
debug add default plugins done [1938.57 ms]
debug init plugins [2388.29 ms]
debug init plugins done [2389.48 ms]
...
```

In addition, the following logs will be output in the terminal, indicating that the Rsbuild has written the internally generated build configs to disk, and you can open these config files to view the corresponding content.

```bash
Inspect config succeeds, open following files to view the content:

   - Rsbuild Config: /Project/demo/dist/rsbuild.config.mjs
   - Rspack Config (web): /Project/demo/dist/rspack.config.web.mjs
```

## Rsbuild Config File

In debug mode, Rsbuild will automatically generate `dist/rsbuild.config.mjs` file, which contains the final generated Rsbuild config. In this file, you can know the final result of the Rsbuild config you passed in after being processed by the framework and Rsbuild.

The structure of the file is as follows:

```js title="rsbuild.config.mjs"
export default {
  dev: {
    // some configs...
  },
  source: {
    // some configs...
  },
  // other configs...
};
```

For a complete introduction to Rsbuild config, please see the [Configure Rsbuild](/guide/basic/configure-rsbuild) chapter.

## Rspack Config File

Rsbuild will also automatically generate `dist/rspack.config.web.mjs` file, which contains the final generated Rspack config. In this file, you can see what is included in the config that Rsbuild finally passes to Rspack.

The structure of the file is as follows:

```js title="rspack.config.web.mjs"
export default {
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
