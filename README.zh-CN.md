<picture>
  <img alt="Rsbuild Banner" src="https://github.com/web-infra-dev/rsbuild/assets/7237365/84abc13e-b620-468f-a90b-dbf28e7e9427">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/XsaKEEk4mW">
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

[English](./README.md) | 简体中文

## 💡 什么是 Rsbuild？

- Rsbuild 是一个基于 Rspack 的 web 构建工具。
- Rsbuild 是一个增强版的 Rspack CLI，更易用、更开箱即用。
- Rsbuild 是 Rspack 团队对于 web 构建最佳实践的探索和实现。
- Rsbuild 是 Webpack 应用迁移到 Rspack 的最佳方案，减少 90% 配置，构建快 10 倍。

## 🚀 性能

Rsbuild 的构建性能与原生 Rspack 处于同一水平。由于 Rsbuild 内置了更多开箱即用的功能，因此性能数据会略微低于 Rspack。

以下是构建 1000 个 React 组件的时间：

![benchmark](https://github.com/web-infra-dev/rsbuild/assets/7237365/16442d44-6939-46de-94f8-369e94c9539a)

> 以上数据基于 Farm 团队搭建的 benchmark，更多信息请参考 [performance-compare](https://github.com/rspack-contrib/performance-compare)。

## 🔥 特性

Rsbuild 具备以下特性：

- **易于配置**：Rsbuild 的目标之一，是为 Rspack 用户提供开箱即用的构建能力，使开发者能够在零配置的情况下开发 web 项目。同时，Rsbuild 提供一套语义化的构建配置，以降低 Rspack 配置的学习成本。

- **性能优先**：Rsbuild 集成了社区中基于 Rust 的高性能工具，包括 [Rspack](https://github.com/web-infra-dev/rspack) 和 [SWC](https://swc.rs/)，以提供一流的构建速度和开发体验。与基于 Webpack 的 Create React App 和 Vue CLI 等工具相比，Rsbuild 提供了 5 ~ 10 倍的构建性能，以及更轻量的依赖体积。

- **插件生态**：Rsbuild 内置一个轻量级的插件系统，提供一系列高质量的官方插件。此外，Rsbuild 兼容大部分的 webpack 插件和所有的 Rspack 插件，这意味着你可以在 Rsbuild 中使用社区或公司内沉淀的现有插件，而不需要重写相关代码。

- **产物稳定**：Rsbuild 设计时充分考虑了构建产物的稳定性，它的开发环境产物和生产构建产物具备较高的一致性，并自动完成语法降级和 polyfill 注入。Rsbuild 也提供插件来进行 TypeScript 类型检查和产物语法检查，以避免线上代码的质量问题和兼容性问题。

- **框架无关**：Rsbuild 不与前端 UI 框架耦合，并通过插件来支持 React、Vue 3、Vue 2、Svelte、Solid、Lit 等框架，未来也计划支持社区中更多的 UI 框架。

## 🎯 定位

除了作为一个构建工具使用，Rsbuild 也为上层的解决方案提供通用的构建能力，比如 [Rspress](https://github.com/web-infra-dev/rspress) 和 [Modern.js](https://github.com/web-infra-dev/modern.js)，使他们能够专注于开发自己领域特定的能力。

下图说明了 Rsbuild 与生态中其他工具之间的关系：

![Rspack Ecosystem](https://github.com/web-infra-dev/rsbuild/assets/7237365/1ec93ad6-b8b1-475b-963f-cba1e7d79dec)

## 📍 路线图

- **2023 年第 4 季度**：发布若干个 Rsbuild 0.x 版本（基于 Rspack 0.x 版本）。
- **2024 年第 1 季度**：发布 Rsbuild 1.0 测试版本（基于 Rspack 1.0 测试版本）。
- **2024 年第 2 季度**：发布 Rsbuild 1.0 稳定版本（基于 Rspack 1.0 稳定版本）。

## 📚 快速上手

你可以参考 [快速上手](https://rsbuild.dev/zh/guide/start/quick-start) 来开始体验 Rsbuild。

## 🦀 生态

- [Rspack](https://github.com/web-infra-dev/rspack)：基于 Rust 的高性能打包工具。
- [Rspress](https://github.com/web-infra-dev/rspress)：基于 Rsbuild 的静态站点生成器。
- [Rsdoctor](https://github.com/web-infra-dev/rsdoctor)：针对 Rspack 和 Webpack 的一站式构建分析工具。
- [Modern.js](https://github.com/web-infra-dev/modern.js)：基于 Rsbuild 的渐进式 React 框架。
- [awesome-rspack](https://github.com/web-infra-dev/awesome-rspack)：与 Rspack 和 Rsbuild 相关的精彩内容列表。
- [rspack-examples](https://github.com/rspack-contrib/rspack-examples)：Rspack、Rsbuild、Rspress 和 Rsdoctor 的示例项目。

## 🤝 参与贡献

> 欢迎参与 Rsbuild 贡献！

请阅读 [贡献指南](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md) 来共同参与 Rsbuild 的建设。

<a href="https://github.com/web-infra-dev/rsbuild/graphs/contributors" target="_blank">
  <table>
    <tr>
      <th colspan="2">
        <br/>
        <img src="https://contrib.rocks/image?repo=web-infra-dev/rsbuild"><br/><br/>
      </th>
    </tr>
    <tr>
      <td>
        <picture>
          <source 
            media="(prefers-color-scheme: dark)" 
            srcset="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=active&period=past_28_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=dark"
          />
          <img 
            alt="Contributors of web-infra-dev/rsbuild" 
            src="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=active&period=past_28_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=light"
          />
        </picture>
      </td>
      <td rowspan="2">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcset="https://next.ossinsight.io/widgets/official/compose-org-participants-growth/thumbnail.png?activity=new&period=past_28_days&owner_id=87694465&repo_ids=701750420&image_size=4x7&color_scheme=dark">
          <img alt="New trends of web-infra-dev" src="https://next.ossinsight.io/widgets/official/compose-org-participants-growth/thumbnail.png?activity=new&period=past_28_days&owner_id=87694465&repo_ids=701750420&image_size=4x7&color_scheme=light">
        </picture>
      </td>
    </tr>
    <tr>
      <td>
        <picture>
          <source 
            media="(prefers-color-scheme: dark)" 
            srcset="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=new&period=past_28_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=dark"
          />
          <img 
            alt="Contributors of web-infra-dev/rsbuild" 
            src="https://next.ossinsight.io/widgets/official/compose-org-active-contributors/thumbnail.png?activity=new&period=past_28_days&owner_id=87694465&repo_ids=701750420&image_size=2x3&color_scheme=light"
          />
        </picture>
      </td>
    </tr>
  </table>
</a>

## 🧑‍💻 社区

欢迎加入我们的 [Discord](https://discord.gg/XsaKEEk4mW) 交流频道！Rspack / Rsbuild 团队和用户都在那里活跃，并且我们一直期待着各种贡献。

你也可以加入 [飞书群](https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=3c3vca77-bfc0-4ef5-b62b-9c5c9c92f1b4) 与大家一起交流。

## 🌟 质量

Rsbuild 通过 [Web Infra QoS](https://web-infra-qos.netlify.app?product=rsbuild&metrics=bundle-size) 来观测核心指标的变化情况，比如 bundle size、compile speed 和 install size。

## 🙌 行为准则

本仓库采纳了字节跳动的开源项目行为准则。请点击 [行为准则](./CODE_OF_CONDUCT.md) 查看更多的信息。

## 🙏 致谢

Rsbuild 的一些实现参考了社区中杰出的项目，对他们表示感谢：

- 部分插件的实现参考了 [create-react-app](https://github.com/facebook/create-react-app)。
- 部分 util 函数参考了 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)。
- 部分 API 的设计参考了 [vite](https://github.com/vitejs/vite)。

Rsbuild 网站由 [Netlify](https://www.netlify.com/) 提供支持。

## 📖 License

Rsbuild 项目基于 [MIT 协议](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE)，请自由地享受和参与开源。
