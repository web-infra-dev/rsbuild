<picture>
  <img alt="Rsbuild Banner" src="https://github.com/web-infra-dev/rsbuild/assets/7237365/84abc13e-b620-468f-a90b-dbf28e7e9427">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/XsaKEEk4mW">
    <img src="https://img.shields.io/badge/chat-discord-blue?logo=discord&colorA=564341&colorB=EDED91" alt="discord channel" />
  </a>
  <a href="https://npmjs.com/package/@rsbuild/shared?activeTab=readme">
   <img src="https://img.shields.io/npm/v/@rsbuild/shared?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <a href="https://npmcharts.com/compare/@rsbuild/core?minimal=true">
    <img src="https://img.shields.io/npm/dm/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" />
  </a>
  <a href="https://nodejs.org/en/about/previous-releases">
    <img src="https://img.shields.io/node/v/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="node version">
  </a>
  <a href="https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/@rsbuild/shared?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  </a>
</p>

English | [简体中文](./README.zh-CN.md)

Rsbuild is a high-performance build tool powered by Rspack. It provides a set of thoughtfully designed default build configs, offering an out-of-the-box development experience and can fully unleash the performance advantages of Rspack.

Rsbuild provides [rich build features](https://rsbuild.dev/guide/start/features), including the compilation of TypeScript, JSX, Sass, Less, CSS Modules, Wasm, and others. It also supports Module Federation, image compression, type checking, PostCSS, Lighting CSS, and more.

## 💡 Comparisons

Rsbuild is a build tool that is on par with [Vite](https://vitejs.dev/), [Create React App](https://github.com/facebook/create-react-app), or [Vue CLI](https://github.com/vuejs/vue-cli). They all come with builtin dev servers, command line tools, and sensible build configurations to provide the out-of-the-box experience.

### CRA / Vue CLI

You can think of Rsbuild as a modernized version of Create React App or Vue CLI, with these main differences:

- The underlying bundler is switched from Webpack to Rspack, providing 5 to 10 times the build performance.
- It is decoupled from frontend UI frameworks and supports all UI frameworks via [plugins](https://rsbuild.dev/plugins/list/), including React, Vue, Svelte, Solid, etc.
- It offers better extensibility. You can extend Rsbuild flexibly via [Configurations](https://rsbuild.dev/config/), [Plugin API](https://rsbuild.dev/plugins/dev/), and [JavaScript API](https://rsbuild.dev/api/start/).

### Vite

Rsbuild shares many similarities with Vite, as they are both aim to improve the frontend development experience. The main differences are:

- **Ecosystem compatibility**: Rsbuild is compatible with most webpack plugins and all Rspack plugins, while Vite is compatible with Rollup plugins. If you're currently using more plugins and loaders from the webpack ecosystem, migrating to Rsbuild would be relatively easy.
- **Production consistency**: Rsbuild uses Rspack for bundling during both the development and production builds, thus ensuring a high level of consistency between the development and production outputs. This is also one of the goals Vite aims to achieve with [Rolldown](https://rolldown.rs/).
- **Module Federation**: The Rsbuild team works closely with the [Module Federation](https://rsbuild.dev/guide/advanced/module-federation) development team, providing first-class support for Module Federation to help you develop large web applications with micro frontend architecture.

## 🚀 Performance

Rsbuild's build performance is on par with native Rspack. This is the time it takes to build 1000 React components:

![benchmark](https://github.com/web-infra-dev/rsbuild/assets/7237365/2909b68f-8928-49c6-8eb3-cd1486dbf876)

> The above data comes from the [performance-compare](https://github.com/rspack-contrib/performance-compare) benchmark.

## 🔥 Features

Rsbuild has the following features:

- **Easy to Configure**: One of the goals of Rsbuild is to provide out-of-the-box build capabilities for Rspack users, allowing developers to start a web project with zero configuration. In addition, Rsbuild provides semantic build configuration to reduce the learning curve for Rspack configuration.

- **Performance Oriented**: Rsbuild integrates high-performance Rust-based tools from the community, including [Rspack](https://rspack.dev), [SWC](https://swc.rs/) and [Lightning CSS](https://lightningcss.dev/), to deliver first-class build speed and development experience.

- **Plugin Ecosystem**: Rsbuild has a lightweight plugin system and includes a range of high-quality official plugins. Furthermore, Rsbuild is compatible with most webpack plugins and all Rspack plugins, allowing users to leverage existing community or in-house plugins in Rsbuild without the need for rewriting code.

- **Stable Artifacts**: Rsbuild is designed with a strong focus on the stability of build artifacts. It ensures high consistency between artifacts in the development and production builds, and automatically completes syntax downgrading and polyfill injection. Rsbuild also provides plugins for type checking and artifact syntax validation to prevent quality and compatibility issues in production code.

- **Framework Agnostic**: Rsbuild is not coupled with any front-end UI framework. It supports frameworks like React, Vue 3, Vue 2, Svelte, Solid, and Lit through plugins, and plans to support more UI frameworks from the community in the future.

## 🎯 Position

In addition to being used as a build tool, Rsbuild also provides universal build capabilities for higher-level solutions, such as [Rspress](https://github.com/web-infra-dev/rspress) and [Modern.js](https://github.com/web-infra-dev/modern.js), allowing them to focus on the development of their own domain specific capabilities.

The following diagram illustrates the relationship between Rsbuild and other tools in the ecosystem:

![Rspack Ecosystem](https://github.com/web-infra-dev/rsbuild/assets/7237365/1ec93ad6-b8b1-475b-963f-cba1e7d79dec)

## 📍 Roadmap

We plan to release Rsbuild v1.0 before July 2024 (based in Rspack v1.0), see [Rsbuild v1.0 Release Plan](https://github.com/web-infra-dev/rsbuild/discussions/1678).

## 📚 Getting Started

To get started with Rsbuild, see the [Quick Start](https://rsbuild.dev/guide/start/quick-start).

## 🦀 Links

- [Rspack](https://github.com/web-infra-dev/rspack): A fast Rust-based web bundler.
- [Rspress](https://github.com/web-infra-dev/rspress): A fast static site generator based on Rsbuild.
- [Rsdoctor](https://github.com/web-infra-dev/rsdoctor): A one-stop build analyzer for Rspack and Webpack.
- [Modern.js](https://github.com/web-infra-dev/modern.js): A progressive React framework based on Rsbuild.
- [awesome-rspack](https://github.com/web-infra-dev/awesome-rspack): A curated list of awesome things related to Rspack and Rsbuild.
- [rspack-examples](https://github.com/rspack-contrib/rspack-examples): Examples for Rspack, Rsbuild, Rspress and Rsdoctor.
- [storybook-rsbuild](https://github.com/rspack-contrib/storybook-rsbuild): Storybook builder powered by Rsbuild.
- [rsbuild-plugin-template](https://github.com/rspack-contrib/rsbuild-plugin-template)：Use this template to create your own Rsbuild plugin.
- [rsfamily-design-resources](https://github.com/rspack-contrib/rsfamily-design-resources)：Design resources for Rspack, Rsbuild, Rspress and Rsdoctor.

## 🤝 Contribution

> New contributors welcome!

Please read the [Contributing Guide](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md).

### Contributors

<a href="https://github.com/web-infra-dev/rsbuild/graphs/contributors" target="_blank">
  <table>
    <tr>
      <th colspan="2">
        <br/>
        <img src="https://contrib.rocks/image?repo=web-infra-dev/rsbuild&columns=16&max=96"><br/><br/>
      </th>
    </tr>
    <tr>
      <td>
        <picture>
          <source 
            media="(prefers-color-scheme: dark)" 
            srcset="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=active&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=dark"
          />
          <img 
            alt="Contributors of web-infra-dev/rsbuild" 
            src="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=active&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=light"
          />
        </picture>
      </td>
      <td rowspan="2">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/compose-org-participants-growth/thumbnail.png?activity=new&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=4x7&color_scheme=dark">
          <img alt="New trends of web-infra-dev" src="https://next.ossinsight.io/widgets/official/compose-org-participants-growth/thumbnail.png?activity=new&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=4x7&color_scheme=light">
        </picture>
      </td>
    </tr>
    <tr>
      <td>
        <picture>
          <source 
            media="(prefers-color-scheme: dark)" 
            srcset="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=new&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=dark"
          />
          <img 
            alt="Contributors of web-infra-dev/rsbuild" 
            src="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=new&period=past_90_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=light"
          />
        </picture>
      </td>
    </tr>
  </table>
</a>

### Code of Conduct

This repo has adopted the ByteDance Open Source Code of Conduct. Please check [Code of Conduct](./CODE_OF_CONDUCT.md) for more details.

## 🧑‍💻 Community

Come and chat with us on [Discord](https://discord.gg/XsaKEEk4mW)! The Rspack / Rsbuild team and users are active there, and we're always looking for contributions.

## 🌟 Quality

Rsbuild uses [Web Infra QoS](https://web-infra-qos.netlify.app?product=rsbuild&metrics=bundle-size) to observe the trend of key metrics, such as bundle size, compile speed and install size.

## 🙏 Credits

Some of the implementations of Rsbuild have drawn inspiration from outstanding projects in the community. We would like to express our gratitude to them:

- The implementation of some plugins is referenced from [create-react-app](https://github.com/facebook/create-react-app).
- Some utility functions are referenced from [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
- The design of some APIs is referenced from [vite](https://github.com/vitejs/vite).

This Rsbuild website is powered by [Netlify](https://www.netlify.com/).

## 📖 License

Rsbuild is licensed under the [MIT License](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE).
