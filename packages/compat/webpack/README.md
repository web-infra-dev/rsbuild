<p align="center">
  <a href="https://rsbuild.dev" target="blank"><img src="https://github.com/web-infra-dev/rsbuild/assets/7237365/84abc13e-b620-468f-a90b-dbf28e7e9427" alt="Rsbuild Logo" /></a>
</p>

# @rsbuild/webpack

This package can be used to switch Rsbuild's bundler from "Rspack" to "Webpack".

Note that this package is mainly used for compatibility with Modern.js and Rsbuild internal testing. We do not recommend you to use this package in a Rsbuild project. The API of the current package may change over iterations.

## Usage

```ts
import { defineConfig } from '@rsbuild/core';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginSwc } from '@rsbuild/plugin-swc';

export default defineConfig({
  provider: webpackProvider,
  plugins: [
    // @rsbuild/webpack has no built-in transformer and minimizer,
    // so you need to register the plugin-swc.
    pluginSwc(),
  ],
});
```

> Note that some Rsbuild plugins cannot be used with the webpack provider.

## Documentation

https://rsbuild.dev/

## Contributing

Please read the [Contributing Guide](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md).

## License

Rsbuild is [MIT licensed](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
