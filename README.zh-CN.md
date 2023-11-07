<picture>
  <img alt="Rsbuild Banner" src="https://github.com/web-infra-dev/rsbuild/assets/7237365/84abc13e-b620-468f-a90b-dbf28e7e9427">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/dfJnVWaG">
    <img src="https://img.shields.io/discord/977448667919286283?logo=discord&label=discord&colorA=564341&colorB=EDED91" alt="discord channel" />
  </a>
  <a href="https://www.npmjs.com/package/@rsbuild/shared?activeTab=readme">
   <img src="https://img.shields.io/npm/v/@rsbuild/shared?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <a href="https://npmcharts.com/compare/@rsbuild/core?minimal=true">
    <img src="https://img.shields.io/npm/dm/@rsbuild/core.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" />
  </a>
  <a href="https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/@rsbuild/shared?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  </a>
</p>

[English](./README.md) | 简体中文

Rsbuild 是一个基于 Rspack 的 web 构建工具。

## 为什么需要 Rsbuild？

Rsbuild 的目标是为 Rspack 用户提供开箱即用的构建能力，使开发者能够在零配置的情况下启动一个 web 项目。

Rsbuild 集成了社区中基于 Rust 的高性能工具，包括 [Rspack](https://github.com/web-infra-dev/rspack)、[Oxc](https://github.com/web-infra-dev/oxc) 和 [SWC](https://swc.rs/)，以提供一流的构建速度和开发体验。

![rsbuild-toolchain](https://github.com/web-infra-dev/rsbuild/assets/7237365/204dadf8-b923-4f9c-8823-f3d75cb133ae)

Rsbuild 还为上层的解决方案（如 Rspress 和 Modern.js）提供通用的构建能力。实际上，Rsbuild 是由 Modern.js Builder 演进而来，它已经与 Modern.js 解耦，以提供更好的灵活性，并满足社区用户的多样化需求。

## 定位

下图说明了 Rsbuild 与生态中其他工具之间的关系：

![Rspack Ecosystem](https://github.com/web-infra-dev/rsbuild/assets/7237365/1ec93ad6-b8b1-475b-963f-cba1e7d79dec)

## 特性

- 🚀 **基于 Rspack**: 享受 Rspack 带来的极致开发体验。
- 🦄 **开箱即用**: 集成生态中最实用的构建功能。
- 🎯 **框架无关**: 支持 React、Vue、Svelte 等框架。
- 🛠️ **深度优化**: 自动优化静态资源，最大化生产性能。
- 🎨 **灵活插拔**: 提供轻量级插件系统和一系列高质量插件。
- 🍭 **易于配置**: 以零配置启动，然后一切皆可配置。

## 快速上手

你可以参考 [快速上手](https://rsbuild.dev/zh/guide/start/quick-start) 来开始体验 Rsbuild。

注意 Rsbuild 项目正在积极开发中，我们仍在持续进行重构和优化，并且文档尚未完全准备就绪。

## 生态

- 🦀 [Rspack](https://github.com/web-infra-dev/rspack): Rsbuild 的底层打包工具。
- 🐹 [Rspress](https://github.com/web-infra-dev/rspress): 基于 Rsbuild 的静态站点生成器。
- 🦄 [Modern.js](https://github.com/web-infra-dev/modern.js): 基于 Rsbuild 的渐进式 React 框架。

## 参与贡献

> 欢迎参与 Rsbuild 贡献！

请阅读 [贡献指南](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md) 来共同参与 Rsbuild 的建设。

## 社区

欢迎加入我们的 [Discord](https://discord.gg/dfJnVWaG) 交流频道！Rspack / Rsbuild 团队和用户都在那里活跃，并且我们一直期待着各种贡献。

你也可以加入 [飞书群](https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=3c3vca77-bfc0-4ef5-b62b-9c5c9c92f1b4) 与大家一起交流。

### 行为准则

本仓库采纳了字节跳动的开源项目行为准则。请点击 [行为准则](./CODE_OF_CONDUCT.md) 查看更多的信息。

## 致谢

Rsbuild 的一些实现参考了以下项目，感谢他们：

- `plugin-module-scope` 和 `plugin-file-size`：参考自 [create-react-app](https://github.com/facebook/create-react-app)
- 部分工具函数参考自 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)。

## License

Rsbuild 项目基于 [MIT 协议](https://github.com/web-infra-dev/modern.js/blob/main/LICENSE)，请自由地享受和参与开源。
