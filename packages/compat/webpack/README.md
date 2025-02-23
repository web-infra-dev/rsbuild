# @rsbuild/webpack

This package can be used to switch Rsbuild's bundler from Rspack to webpack.

<p>
  <a href="https://npmjs.com/package/@rsbuild/webpack">
   <img src="https://img.shields.io/npm/v/@rsbuild/webpack?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/@rsbuild/webpack?minimal=true"><img src="https://img.shields.io/npm/dm/@rsbuild/webpack.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

> Note that this package is mainly used for compatibility with Modern.js and Rsbuild internal testing. We do not recommend you to use this package in a Rsbuild project. The API of the current package may change over iterations.

## Usage

```ts
import { defineConfig } from '@rsbuild/core';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginSwc } from '@rsbuild/plugin-webpack-swc';

export default defineConfig({
  provider: webpackProvider,
  plugins: [
    // @rsbuild/webpack has no built-in transformer and minimizer,
    // so you need to register the @rsbuild/plugin-webpack-swc.
    pluginSwc(),
  ],
});
```

> Note that some Rsbuild plugins cannot be used with the webpack provider.

## Documentation

See [Documentation](https://rsbuild.dev).

## License

[MIT](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
