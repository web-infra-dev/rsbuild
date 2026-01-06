<picture>
  <img alt="Rsbuild Banner" src="https://assets.rspack.rs/rsbuild/rsbuild-banner.png">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/XsaKEEk4mW"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat-square&logo=discord&colorA=564341&colorB=EDED91" alt="discord channel" /></a>
  <a href="https://npmjs.com/package/@rsbuild/core?activeTab=readme"><img src="https://img.shields.io/npm/v/@rsbuild/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="https://npmcharts.com/compare/@rsbuild/core"><img src="https://img.shields.io/npm/dm/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="node version"></a>
  <a href="https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" /></a>
  <a href="https://deepwiki.com/web-infra-dev/rsbuild"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" /></a>
</p>

English | [Portuguese](./README.pt-BR.md) | [简体中文](./README.zh-CN.md)

Rsbuild is a high-performance build tool powered by Rspack. It provides carefully designed defaults for an out-of-the-box development experience while fully leveraging Rspack's performance.

Rsbuild provides a [rich set of build features](https://rsbuild.rs/guide/start/features), including support for TypeScript, JSX, Sass, Less, CSS Modules, Wasm, and more. It also supports Module Federation, image compression, type checking, PostCSS, Lightning CSS, and additional features.

> [!NOTE]
> The `main` branch is under active development for **Rsbuild 2.0**.  
> The stable **1.x** releases are maintained in the [v1.x](https://github.com/web-infra-dev/rsbuild/tree/v1.x) branch.

## 🚀 Performance

Powered by Rspack's Rust-based architecture, Rsbuild delivers blazing-fast performance to speed up your development workflow.

⚡️ **Build 1000 React components:**

![benchmark](https://assets.rspack.rs/rsbuild/assets/benchmark-latest.jpeg)

> 📊 Benchmark results from [build-tools-performance](https://github.com/rstackjs/build-tools-performance).

## 🔥 Features

Rsbuild has the following features:

- **Easy to configure**: One of Rsbuild's goals is to give Rspack users out-of-the-box build capabilities so they can start web projects with zero configuration. Rsbuild also provides a semantic build configuration API to reduce the Rspack learning curve.

- **Performance-focused**: Rsbuild integrates high-performance Rust-based tools from the community, including [Rspack](https://rspack.rs), [SWC](https://swc.rs/), and [Lightning CSS](https://lightningcss.dev/), delivering first-class build speed and development experience.

- **Plugin ecosystem**: Rsbuild has a lightweight plugin system and includes a range of high-quality official plugins. It is also compatible with most webpack plugins and all Rspack plugins, allowing you to use existing community or in-house plugins without rewriting code.

- **Stable artifacts**: Rsbuild places a strong focus on build artifact stability. It ensures consistent artifacts in development and production builds, and automatically handles syntax downgrading and polyfill injection. Rsbuild also provides plugins for type checking and artifact syntax validation to prevent quality and compatibility issues from reaching production code.

- **Framework agnostic**: Rsbuild is not coupled to any frontend UI framework. It supports frameworks like React, Vue, Svelte, Solid, and Preact through plugins, with plans to support more UI frameworks from the community in the future.

## 📚 Getting started

To get started with Rsbuild, see the [Quick start](https://rsbuild.rs/guide/start/quick-start).

## 🦀 Rstack

Rstack is a unified JavaScript toolchain centered on Rspack, with high performance and consistent architecture.

| Name                                                  | Description              | Version                                                                                                                                                                          |
| ----------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Rspack](https://github.com/web-infra-dev/rspack)     | Bundler                  | <a href="https://npmjs.com/package/@rspack/core"><img src="https://img.shields.io/npm/v/@rspack/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>     |
| [Rsbuild](https://github.com/web-infra-dev/rsbuild)   | Build tool               | <a href="https://npmjs.com/package/@rsbuild/core"><img src="https://img.shields.io/npm/v/@rsbuild/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>   |
| [Rslib](https://github.com/web-infra-dev/rslib)       | Library development tool | <a href="https://npmjs.com/package/@rslib/core"><img src="https://img.shields.io/npm/v/@rslib/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>       |
| [Rspress](https://github.com/web-infra-dev/rspress)   | Static site generator    | <a href="https://npmjs.com/package/@rspress/core"><img src="https://img.shields.io/npm/v/@rspress/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>   |
| [Rsdoctor](https://github.com/web-infra-dev/rsdoctor) | Build analyzer           | <a href="https://npmjs.com/package/@rsdoctor/core"><img src="https://img.shields.io/npm/v/@rsdoctor/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a> |
| [Rstest](https://github.com/web-infra-dev/rstest)     | Testing framework        | <a href="https://npmjs.com/package/@rstest/core"><img src="https://img.shields.io/npm/v/@rstest/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>     |
| [Rslint](https://github.com/web-infra-dev/rslint)     | Linter                   | <a href="https://npmjs.com/package/@rslint/core"><img src="https://img.shields.io/npm/v/@rslint/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>     |

## 🔗 Links

- [awesome-rstack](https://github.com/rstackjs/awesome-rstack): A curated list of awesome things related to Rstack.
- [rstack-examples](https://github.com/rstackjs/rstack-examples): Examples showcasing Rstack.
- [storybook-rsbuild](https://github.com/rstackjs/storybook-rsbuild): Storybook builder powered by Rsbuild.
- [rsbuild-plugin-template](https://github.com/rstackjs/rsbuild-plugin-template)：Use this template to create your own Rsbuild plugin.
- [rstack-design-resources](https://github.com/rstackjs/rstack-design-resources)：Design resources for Rstack.

## 🤝 Contribution

> [!NOTE]
> We highly value any contributions to Rsbuild!

Please read the [Contributing Guide](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md).

### Contributors

<a href="https://github.com/web-infra-dev/rsbuild/graphs/contributors" target="_blank">
  <img src="https://contrib.rocks/image?repo=web-infra-dev/rsbuild&columns=24">
</a>

### Code of conduct

This repo has adopted the ByteDance open source code of conduct. Please check [Code of conduct](./CODE_OF_CONDUCT.md) for more details.

## 🧑‍💻 Community

Come and chat with us on [Discord](https://discord.gg/XsaKEEk4mW)! The Rstack team and users are active there, and we're always looking for contributions.

## 🌟 Quality

Rsbuild uses [Web Infra QoS](https://web-infra-qos.netlify.app?product=rsbuild&metrics=bundle-size) to observe the trend of key metrics, such as bundle size, compile speed and install size.

## 🙏 Credits

Rsbuild has been inspired by several outstanding projects in the community. We would like to acknowledge and express our sincere gratitude to the following projects:

- Various plugin implementations have been inspired by [create-react-app](https://github.com/facebook/create-react-app)
- Multiple utility functions have been adapted from [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
- Several API design patterns have been influenced by [Vite](https://github.com/vitejs/vite)

Special thanks to [Netlify](https://netlify.com/) for providing hosting services for the Rsbuild documentation website.

## 📖 License

Rsbuild is licensed under the [MIT License](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
