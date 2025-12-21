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

Rsbuild is a high-performance build tool powered by Rspack. It provides carefully designed default configurations that deliver an out-of-the-box development experience while fully leveraging Rspack's performance.

Rsbuild provides a [rich set of build features](https://rsbuild.rs/guide/start/features), including compilation of TypeScript, JSX, Sass, Less, CSS Modules, Wasm, and more. It also supports Module Federation, image compression, type checking, PostCSS, Lightning CSS, and additional features.

## 🚀 Performance

Powered by Rspack's Rust-based architecture, Rsbuild delivers blazing-fast performance to speed up your development workflow.

⚡️ **Build 1000 React components:**

![benchmark](https://assets.rspack.rs/rsbuild/assets/benchmark-latest.jpeg)

> 📊 Benchmark results from [build-tools-performance](https://github.com/rspack-contrib/build-tools-performance).

## 💡 Comparisons

Rsbuild is comparable to [Vite](https://vitejs.dev/), [Create React App](https://github.com/facebook/create-react-app), or [Vue CLI](https://github.com/vuejs/vue-cli). Each of these tools includes a built-in dev server, command-line tools, and sensible build configurations for an out-of-the-box experience.

![](https://assets.rspack.rs/rsbuild/assets/rsbuild-1-0-build-tools.png)

### CRA / Vue CLI

You can think of Rsbuild as a modernized version of Create React App or Vue CLI, with these main differences:

- The underlying bundler is switched from webpack to Rspack, providing 5 to 10 times the build performance.
- It is decoupled from frontend UI frameworks and supports all frameworks via [plugins](https://rsbuild.rs/plugins/list/), including React, Vue, Svelte, Solid, and more.
- It is more extensible. You can extend Rsbuild through [Configurations](https://rsbuild.rs/config/), [Plugin API](https://rsbuild.rs/plugins/dev/), and [JavaScript API](https://rsbuild.rs/api/start/).

### Vite

Rsbuild shares many similarities with Vite, as they both aim to improve the frontend development experience. The main differences are:

- **Ecosystem compatibility**: Rsbuild is compatible with most webpack plugins and all Rspack plugins, while Vite is compatible with Rollup plugins. If you're currently using more plugins and loaders from the webpack ecosystem, migrating to Rsbuild would be relatively easy.
- **Production consistency**: Rsbuild uses Rspack for bundling during both the development and production builds, thus ensuring a high level of consistency between the development and production outputs. This is also one of the goals Vite aims to achieve with Rolldown.
- **Module Federation**: The Rsbuild team works closely with the [Module Federation](https://rsbuild.rs/guide/advanced/module-federation) development team, providing first-class support for Module Federation to help you develop large web applications with micro-frontend architecture.

## 🔥 Features

Rsbuild has the following features:

- **Easy to configure**: One of the goals of Rsbuild is to provide out-of-the-box build capabilities for Rspack users, allowing developers to start a web project with zero configuration. In addition, Rsbuild provides a semantic build configuration API to reduce the learning curve for Rspack configuration.

- **Performance-focused**: Rsbuild integrates high-performance Rust-based tools from the community, including [Rspack](https://rspack.rs), [SWC](https://swc.rs/) and [Lightning CSS](https://lightningcss.dev/), delivering first-class build speed and development experience.

- **Plugin ecosystem**: Rsbuild has a lightweight plugin system and includes a range of high-quality official plugins. It is also compatible with most webpack plugins and all Rspack plugins, allowing users to leverage existing community or in-house plugins in Rsbuild without rewriting code.

- **Stable artifacts**: Rsbuild is designed with a strong focus on the stability of build artifacts. It ensures high consistency between artifacts in the development and production builds, and automatically completes syntax downgrading and polyfill injection. Rsbuild also provides plugins for type checking and artifact syntax validation to prevent quality and compatibility issues in production code.

- **Framework agnostic**: Rsbuild is not coupled with any front-end UI framework. It supports frameworks like React, Vue, Svelte, Solid, and Preact through plugins, and plans to support more UI frameworks from the community in the future.

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

- [awesome-rstack](https://github.com/web-infra-dev/awesome-rstack): A curated list of awesome things related to Rstack.
- [rstack-examples](https://github.com/rspack-contrib/rstack-examples): Examples showcasing Rstack.
- [storybook-rsbuild](https://github.com/rspack-contrib/storybook-rsbuild): Storybook builder powered by Rsbuild.
- [rsbuild-plugin-template](https://github.com/rspack-contrib/rsbuild-plugin-template)：Use this template to create your own Rsbuild plugin.
- [rstack-design-resources](https://github.com/rspack-contrib/rstack-design-resources)：Design resources for Rstack.

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
