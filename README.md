<picture>
  <img alt="Rsbuild Banner" src="https://github.com/web-infra-dev/rsbuild/assets/7237365/84abc13e-b620-468f-a90b-dbf28e7e9427">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/dfJnVWaG">
    <img src="https://img.shields.io/discord/977448667919286283?logo=discord&label=discord&colorA=564341&colorB=EDED91" alt="discord channel" />
  </a>
  <a href="https://npmjs.com/package/@rsbuild/shared?activeTab=readme">
   <img src="https://img.shields.io/npm/v/@rsbuild/shared?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <a href="https://npmcharts.com/compare/@rsbuild/core?minimal=true">
    <img src="https://img.shields.io/npm/dm/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" />
  </a>
  <a href="https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/@rsbuild/shared?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  </a>
</p>

English | [简体中文](./README.zh-CN.md)

## 💡 What is Rsbuild?

- Rsbuild is an Rspack-based build tool for the web.
- Rsbuild is an enhanced Rspack CLI, which is more user-friendly and powerful.
- Rsbuild is the Rspack team's exploration and implementation of best practices for web building.
- Rsbuild is the best solution for migrating from Webpack to Rspack, reducing configuration by 90% and getting 10x build speed.

## 🚀 Performance

The build performance of Rsbuild is on a par with native Rspack. Considering that Rsbuild includes more out-of-the-box features, its performance will be slightly lower than Rspack.

This is the time it takes to build 1000 React components:

![benchmark-11211243](https://github.com/web-infra-dev/rsbuild/assets/7237365/d14dcdcd-ec08-4213-85d0-ab055db053ee)

> The data is based on the benchmark built by the Farm team, more info in [performance-compare](https://github.com/rspack-contrib/performance-compare).

## 🔥 Features

Rsbuild has the following features:

- **Easy to Configure**: One of the goals of Rsbuild is to provide out-of-the-box build capabilities for Rspack users, allowing developers to start a web projects with zero configuration. In addition, Rsbuild provides semantic build configuration to reduce the learning curve for Rspack configuration.

- **Performance Oriented**: Rsbuild integrates high-performance Rust-based tools from the community, including [Rspack](https://github.com/web-infra-dev/rspack) and [SWC](https://swc.rs/), to deliver top-notch build speed and development experience. Compared to webpack-based tools like Create React App and Vue CLI, Rsbuild provides 5 to 10 times faster build performance and lighter dependencies.

- **Plugin Ecosystem**: Rsbuild has a lightweight plugin system and includes a range of high-quality official plugins. Furthermore, Rsbuild is compatible with most webpack plugins and all Rspack plugins, allowing users to leverage existing community or in-house plugins in Rsbuild without the need for rewriting code.

- **Stable Artifacts**: Rsbuild is designed with a strong focus on the stability of build artifacts. It ensures high consistency between artifacts in the development environment and production builds, and automatically completes syntax downgrading and polyfill injection. Rsbuild also provides plugins for type checking and artifact syntax validation to prevent quality and compatibility issues in production code.

- **Framework Agnostic**: Rsbuild is not coupled with any front-end UI framework. It supports frameworks like React, Vue 3, Vue 2, Svelte, and Lit through plugins, and plans to support more UI frameworks from the community in the future.

## 🎯 Position

In addition to being used as a build tool, Rsbuild also provides universal build capabilities for higher-level solutions, such as [Rspress](https://github.com/web-infra-dev/rspress) and [Modern.js](https://github.com/web-infra-dev/modern.js). In fact, Rsbuild is a rebrand of the Modern.js Builder. It has been decoupled from Modern.js to provide greater flexibility and to meet the diverse needs of community users.

The following diagram illustrates the relationship between Rsbuild and other tools in the ecosystem:

![Rspack Ecosystem](https://github.com/web-infra-dev/rsbuild/assets/7237365/1ec93ad6-b8b1-475b-963f-cba1e7d79dec)

## 📚 Getting Started

You can refer to [Quick Start](https://rsbuild.dev/guide/start/quick-start) to start experiencing Rsbuild.

Please note that the Rsbuild project is still under active development. We are still in the process of refactoring and optimizing. The documentation is not yet complete.

## 🦀 Ecosystem

- [Rspack](https://github.com/web-infra-dev/rspack): the underlying bundler of Rsbuild.
- [Rspress](https://github.com/web-infra-dev/rspress): A fast static site generator based on Rsbuild.
- [Modern.js](https://github.com/web-infra-dev/modern.js): A progressive React framework based on Rsbuild.
- [awesome-rspack](https://github.com/web-infra-dev/awesome-rspack): A curated list of awesome things related to Rspack and Rsbuild.

## 🤝 Contribution

> New contributors welcome!

Please read the [Contributing Guide](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md).

## 🧑‍💻 Community

Come and chat with us on [Discord](https://discord.gg/dfJnVWaG)! The Rspack / Rsbuild team and users are active there, and we're always looking for contributions.

## 🙌 Code of Conduct

This repo has adopted the ByteDance Open Source Code of Conduct. Please check [Code of Conduct](./CODE_OF_CONDUCT.md) for more details.

## 🤗 Credits

Some of the implementations of Rsbuild have drawn inspiration from outstanding projects in the community. We would like to express our gratitude to them:

- The implementation of some plugins is referenced from [create-react-app](https://github.com/facebook/create-react-app)
- Some utility functions are referenced from [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
- The design of some APIs is referenced from [vite](https://github.com/vitejs/vite).

## 📖 License

Rsbuild is licensed under the [MIT License](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
