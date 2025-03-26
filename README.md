<picture>
  <img alt="Rsbuild Banner" src="https://assets.rspack.dev/rsbuild/rsbuild-banner.png">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/XsaKEEk4mW"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat-square&logo=discord&colorA=564341&colorB=EDED91" alt="discord channel" /></a>
  <a href="https://npmjs.com/package/@rsbuild/core?activeTab=readme"><img src="https://img.shields.io/npm/v/@rsbuild/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="https://npmcharts.com/compare/@rsbuild/core?minimal=true"><img src="https://img.shields.io/npm/dm/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="node version"></a>
  <a href="https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" /></a>
</p>

English | [Portuguese](./README.pt-BR.md) | [简体中文](./README.zh-CN.md)

Rsbuild is a high-performance build tool powered by Rspack. It provides a set of thoughtfully designed default build configs, offering an out-of-the-box development experience and can fully unleash the performance advantages of Rspack.

Rsbuild provides [rich build features](https://rsbuild.dev/guide/start/features), including the compilation of TypeScript, JSX, Sass, Less, CSS Modules, Wasm, and others. It also supports Module Federation, image compression, type checking, PostCSS, Lightning CSS, and more.

## 🚀 Performance

Powered by Rspack's Rust-based architecture, Rsbuild delivers blazing fast performance that will reshape your development workflow.

⚡️ **Build 1000 React components:**

![benchmark](https://assets.rspack.dev/rsbuild/assets/benchmark-latest.jpeg)

> 📊 Benchmark results from [build-tools-performance](https://github.com/rspack-contrib/build-tools-performance).

## 💡 Comparisons

Rsbuild is a build tool that is on par with [Vite](https://vitejs.dev/), [Create React App](https://github.com/facebook/create-react-app), or [Vue CLI](https://github.com/vuejs/vue-cli). They all come with builtin dev servers, command line tools, and sensible build configurations to provide the out-of-the-box experience.

![](https://assets.rspack.dev/rsbuild/assets/rsbuild-1-0-build-tools.png)

### CRA / Vue CLI

You can think of Rsbuild as a modernized version of Create React App or Vue CLI, with these main differences:

- The underlying bundler is switched from webpack to Rspack, providing 5 to 10 times the build performance.
- It is decoupled from frontend UI frameworks and supports all UI frameworks via [plugins](https://rsbuild.dev/plugins/list/), including React, Vue, Svelte, Solid, etc.
- It offers better extensibility. You can extend Rsbuild flexibly via [Configurations](https://rsbuild.dev/config/), [Plugin API](https://rsbuild.dev/plugins/dev/), and [JavaScript API](https://rsbuild.dev/api/start/).

### Vite

Rsbuild shares many similarities with Vite, as they both aim to improve the frontend development experience. The main differences are:

- **Ecosystem compatibility**: Rsbuild is compatible with most webpack plugins and all Rspack plugins, while Vite is compatible with Rollup plugins. If you're currently using more plugins and loaders from the webpack ecosystem, migrating to Rsbuild would be relatively easy.
- **Production consistency**: Rsbuild uses Rspack for bundling during both the development and production builds, thus ensuring a high level of consistency between the development and production outputs. This is also one of the goals Vite aims to achieve with Rolldown.
- **Module Federation**: The Rsbuild team works closely with the [Module Federation](https://rsbuild.dev/guide/advanced/module-federation) development team, providing first-class support for Module Federation to help you develop large web applications with micro frontend architecture.

## 🔥 Features

Rsbuild has the following features:

- **Easy to Configure**: One of the goals of Rsbuild is to provide out-of-the-box build capabilities for Rspack users, allowing developers to start a web project with zero configuration. In addition, Rsbuild provides semantic build configuration to reduce the learning curve for Rspack configuration.

- **Performance Oriented**: Rsbuild integrates high-performance Rust-based tools from the community, including [Rspack](https://rspack.dev), [SWC](https://swc.rs/) and [Lightning CSS](https://lightningcss.dev/), to deliver first-class build speed and development experience.

- **Plugin Ecosystem**: Rsbuild has a lightweight plugin system and includes a range of high-quality official plugins. Furthermore, Rsbuild is compatible with most webpack plugins and all Rspack plugins, allowing users to leverage existing community or in-house plugins in Rsbuild without the need for rewriting code.

- **Stable Artifacts**: Rsbuild is designed with a strong focus on the stability of build artifacts. It ensures high consistency between artifacts in the development and production builds, and automatically completes syntax downgrading and polyfill injection. Rsbuild also provides plugins for type checking and artifact syntax validation to prevent quality and compatibility issues in production code.

- **Framework Agnostic**: Rsbuild is not coupled with any front-end UI framework. It supports frameworks like React, Vue, Svelte, Solid, and Preact through plugins, and plans to support more UI frameworks from the community in the future.

## 🎯 Ecosystem

Rsbuild provides JavaScript API and plugin API for higher-level frameworks and tools. For example, we have implemented [Rspress](https://github.com/web-infra-dev/rspress) and [Rslib](https://github.com/web-infra-dev/rslib) based on Rsbuild, taking full advantage of its capabilities and ecosystem.

The following diagram illustrates Rsbuild's position in the Rstack ecosystem:

<img
  src="https://assets.rspack.dev/rstack/rstack-overview.png"
  alt="Rstack"
  width="820"
/>

## 📚 Getting started

To get started with Rsbuild, see the [Quick start](https://rsbuild.dev/guide/start/quick-start).

## 🦀 Links

- [Rspack](https://github.com/web-infra-dev/rspack): A fast Rust-based web bundler.
- [Rspress](https://github.com/web-infra-dev/rspress): A fast static site generator based on Rsbuild.
- [Rsdoctor](https://github.com/web-infra-dev/rsdoctor): A one-stop build analyzer for Rspack and webpack.
- [Rslib](https://github.com/web-infra-dev/rslib): The library development tool powered by Rsbuild.
- [Modern.js](https://github.com/web-infra-dev/modern.js): A progressive React framework based on Rsbuild.
- [awesome-rspack](https://github.com/web-infra-dev/awesome-rspack): A curated list of awesome things related to Rspack and Rsbuild.
- [rstack-examples](https://github.com/rspack-contrib/rstack-examples): Examples showcasing Rstack tools (Rspack, Rsbuild, Rspress, Rsdoctor).
- [storybook-rsbuild](https://github.com/rspack-contrib/storybook-rsbuild): Storybook builder powered by Rsbuild.
- [rsbuild-plugin-template](https://github.com/rspack-contrib/rsbuild-plugin-template)：Use this template to create your own Rsbuild plugin.
- [rstack-design-resources](https://github.com/rspack-contrib/rstack-design-resources)：Design resources for Rspack, Rsbuild, Rspress and Rsdoctor.

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

Come and chat with us on [Discord](https://discord.gg/XsaKEEk4mW)! The Rspack / Rsbuild team and users are active there, and we're always looking for contributions.

## 🌟 Quality

Rsbuild uses [Web Infra QoS](https://web-infra-qos.netlify.app?product=rsbuild&metrics=bundle-size) to observe the trend of key metrics, such as bundle size, compile speed and install size.

## 🙏 Credits

Rsbuild has been inspired by several outstanding projects in the community. We would like to acknowledge and express our sincere gratitude to the following projects:

- Various plugin implementations have been inspired by [create-react-app](https://github.com/facebook/create-react-app)
- Multiple utility functions have been adapted from [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
- Several API design patterns have been influenced by [Vite](https://github.com/vitejs/vite)

Special thanks to [Netlify](https://www.netlify.com/) for providing hosting services for the Rsbuild documentation website.

## 📖 License

Rsbuild is licensed under the [MIT License](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
