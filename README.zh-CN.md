<picture>
  <img alt="Rsbuild Banner" src="https://assets.rspack.rs/rsbuild/rsbuild-banner.png">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/XsaKEEk4mW"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat-square&logo=discord&colorA=564341&colorB=EDED91" alt="discord channel" /></a>
  <a href="https://npmjs.com/package/@rsbuild/core?activeTab=readme"><img src="https://img.shields.io/npm/v/@rsbuild/core?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" /></a>
  <a href="https://npmcharts.com/compare/@rsbuild/core?minimal=true"><img src="https://img.shields.io/npm/dm/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
  <a href="https://nodejs.org/en/about/previous-releases"><img src="https://img.shields.io/node/v/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="node version"></a>
  <a href="https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" /></a>
  <a href="https://deepwiki.com/web-infra-dev/rsbuild"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" /></a>
</p>

[English](./README.md) | [Portuguese](./README.pt-BR.md) | 简体中文

Rsbuild 是由 [Rspack](https://rspack.rs/) 驱动的高性能构建工具，它默认包含了一套精心设计的构建配置，提供开箱即用的开发体验，并能够充分发挥出 Rspack 的性能优势。

Rsbuild 提供 [丰富的构建功能](https://rsbuild.rs/zh/guide/start/features)，包括编译 TypeScript，JSX，Sass，Less，CSS Modules，Wasm，以及其他资源，也支持模块联邦、图片压缩、类型检查、PostCSS，Lightning CSS 等功能。

## 🚀 性能

基于 Rspack 的 Rust 架构，Rsbuild 能够提供极致的构建性能，为你带来全新的开发体验。

⚡️ **构建 1000 个 React 组件：**

![benchmark](https://assets.rspack.rs/rsbuild/assets/benchmark-latest.jpeg)

> 📊 Benchmark 结果来自 [build-tools-performance](https://github.com/rspack-contrib/build-tools-performance)。

## 💡 对比其他工具

Rsbuild 是与 [Vite](https://vitejs.dev/)、[Create React App](https://github.com/facebook/create-react-app) 或 [Vue CLI](https://github.com/vuejs/vue-cli) 相似的构建工具，它们都默认包含了开发服务器、命令行工具和合理的构建配置，以此来提供开箱即用的体验。

![](https://assets.rspack.rs/rsbuild/assets/rsbuild-1-0-build-tools.png)

### CRA / Vue CLI

你可以将 Rsbuild 理解为一个现代化的 Create React App 或 Vue CLI，它与这些工具的主要区别在于：

- 底层的打包工具由 webpack 替换为 Rspack，提供 5 ~ 10 倍的构建性能。
- 与前端 UI 框架解耦，并通过 [插件](https://rsbuild.rs/zh/plugins/list/) 来支持所有 UI 框架，包括 React、Vue、Svelte、Solid 等。
- 提供更好的扩展性，你可以通过 [配置](https://rsbuild.rs/zh/config/)、[插件 API](https://rsbuild.rs/zh/plugins/dev/) 和 [JavaScript API](https://rsbuild.rs/zh/api/start/) 来灵活地扩展 Rsbuild。

### Vite

Rsbuild 与 Vite 有许多相似之处，它们皆致力于提升前端的开发体验。其主要区别在于：

- **生态兼容性**：Rsbuild 兼容大部分的 webpack 插件和所有 Rspack 插件，而 Vite 则是兼容 Rollup 插件。如果你目前更多地使用了 webpack 生态的插件和 loaders，那么迁移到 Rsbuild 是相对容易的。
- **生产一致性**：Rsbuild 在开发阶段和生产构建均使用 Rspack 进行打包，因此开发和生产构建的产物具备较强的一致性，这也是 Vite 通过 Rolldown 想要实现的目标之一。
- **模块联邦**：Rsbuild 团队与 [Module Federation](https://rsbuild.rs/zh/guide/advanced/module-federation) 的开发团队密切合作，并为 Module Federation 提供一流的支持，帮助你开发微前端架构的大型 Web 应用。

## 🔥 特性

Rsbuild 具备以下特性：

- **易于配置**：Rsbuild 的目标之一，是为 Rspack 用户提供开箱即用的构建能力，使开发者能够在零配置的情况下开发 web 项目。同时，Rsbuild 提供一套语义化的构建配置，以降低 Rspack 配置的学习成本。

- **性能优先**：Rsbuild 集成了社区中基于 Rust 的高性能工具，包括 [Rspack](https://rspack.rs)，[SWC](https://swc.rs/) 和 [Lightning CSS](https://lightningcss.dev/)，以提供一流的构建速度和开发体验。

- **插件生态**：Rsbuild 内置一个轻量级的插件系统，提供一系列高质量的官方插件。此外，Rsbuild 兼容大部分的 webpack 插件和所有的 Rspack 插件，这意味着你可以在 Rsbuild 中使用社区或公司内沉淀的现有插件，而无须重写相关代码。

- **产物稳定**：Rsbuild 设计时充分考虑了构建产物的稳定性，它的开发和生产构建产物具备较强的一致性，并自动完成语法降级和 polyfill 注入。Rsbuild 也提供插件来进行 TypeScript 类型检查和产物语法检查，以避免线上代码的质量问题和兼容性问题。

- **框架无关**：Rsbuild 不与前端 UI 框架耦合，并通过插件来支持 React、Vue、Svelte、Solid、Preact 等框架，未来也计划支持社区中更多的 UI 框架。

## 📚 快速上手

你可以参考 [快速上手](https://rsbuild.rs/zh/guide/start/quick-start) 来开始体验 Rsbuild。

## 🦀 Rstack

Rstack 是一个围绕 Rspack 打造的 JavaScript 统一工具链，具有优秀的性能和一致的架构。

| 名称                                                  | 描述           |
| ----------------------------------------------------- | -------------- |
| [Rspack](https://github.com/web-infra-dev/rspack)     | 打包工具       |
| [Rsbuild](https://github.com/web-infra-dev/rsbuild)   | 构建工具       |
| [Rslib](https://github.com/web-infra-dev/rslib)       | 库开发工具     |
| [Rspress](https://github.com/web-infra-dev/rspress)   | 静态站点生成器 |
| [Rsdoctor](https://github.com/web-infra-dev/rsdoctor) | 构建分析工具   |
| [Rstest](https://github.com/web-infra-dev/rstest)     | 测试框架       |

## 🔗 链接

- [awesome-rspack](https://github.com/web-infra-dev/awesome-rspack)：与 Rstack 相关的精彩内容列表。
- [rstack-examples](https://github.com/rspack-contrib/rstack-examples)：Rstack 的示例项目。
- [storybook-rsbuild](https://github.com/rspack-contrib/storybook-rsbuild): 基于 Rsbuild 构建的 Storybook。
- [rsbuild-plugin-template](https://github.com/rspack-contrib/rsbuild-plugin-template)：使用此模板创建你的 Rsbuild 插件。
- [rstack-design-resources](https://github.com/rspack-contrib/rstack-design-resources)：Rstack 的设计资源。

## 🤝 参与贡献

> [!NOTE]
> 我们非常欢迎任何对 Rsbuild 的贡献！

请阅读 [贡献指南](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md) 来共同参与 Rsbuild 的建设。

### 贡献者

<a href="https://github.com/web-infra-dev/rsbuild/graphs/contributors" target="_blank">
  <img src="https://contrib.rocks/image?repo=web-infra-dev/rsbuild&columns=24">
</a>

### 行为准则

本仓库采纳了字节跳动的开源项目行为准则。请点击 [行为准则](./CODE_OF_CONDUCT.md) 查看更多的信息。

## 🧑‍💻 社区

欢迎加入我们的 [Discord](https://discord.gg/XsaKEEk4mW) 交流频道！Rstack 团队和用户都在那里活跃，并且我们一直期待着各种贡献。

你也可以加入 [飞书群](https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=3c3vca77-bfc0-4ef5-b62b-9c5c9c92f1b4) 与大家一起交流。

## 🌟 质量

Rsbuild 通过 [Web Infra QoS](https://web-infra-qos.netlify.app?product=rsbuild&metrics=bundle-size) 来观测核心指标的变化情况，比如 bundle size、compile speed 和 install size。

## 🙏 致谢

Rsbuild 受到社区中几个杰出项目的启发。我们想要对以下项目表示认可和诚挚的感谢：

- 多个插件的实现受到 [create-react-app](https://github.com/facebook/create-react-app) 的启发
- 多个实用工具函数改编自 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
- 一些 API 设计模式受到 [Vite](https://github.com/vitejs/vite) 的影响

特别感谢 [Netlify](https://netlify.com/) 为 Rsbuild 文档网站提供托管服务。

## 📖 License

Rsbuild 项目基于 [MIT 协议](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE)，请自由地享受和参与开源。
