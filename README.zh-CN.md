<picture>
  <img alt="Rsbuild Banner" src="https://github.com/web-infra-dev/rsbuild/assets/7237365/84abc13e-b620-468f-a90b-dbf28e7e9427">
</picture>

# Rsbuild

<p>
  <a href="https://discord.gg/XsaKEEk4mW">
    <img src="https://img.shields.io/badge/chat-discord-blue?style=flat-square&logo=discord&colorA=564341&colorB=EDED91" alt="discord channel" />
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

[English](./README.md) | 简体中文

Rsbuild 是由 [Rspack](https://rspack.dev/) 驱动的高性能构建工具，它默认包含了一套精心设计的构建配置，提供开箱即用的开发体验，并能够充分发挥出 Rspack 的性能优势。

Rsbuild 提供 [丰富的构建功能](https://rsbuild.dev/zh/guide/start/features)，包括编译 TypeScript，JSX，Sass，Less，CSS Modules，Wasm，以及其他资源，也支持模块联邦、图片压缩、类型检查、PostCSS，Lighting CSS 等功能。

## 💡 对比其他工具

Rsbuild 是与 [Vite](https://vitejs.dev/)、[Create React App](https://github.com/facebook/create-react-app) 或 [Vue CLI](https://github.com/vuejs/vue-cli) 处于同一层级的构建工具，它们都默认包含了开发服务器、命令行工具和合理的构建配置，以此来提供开箱即用的体验。

### CRA / Vue CLI

你可以将 Rsbuild 理解为一个现代化的 Create React App 或 Vue CLI，它与这些工具的主要区别在于：

- 底层的打包工具由 Webpack 替换为 Rspack，提供 5 ~ 10 倍的构建性能。
- 与前端 UI 框架解耦，并通过 [插件](https://rsbuild.dev/zh/plugins/list/) 来支持所有 UI 框架，包括 React、Vue、Svelte、Solid 等。
- 提供更好的扩展性，你可以通过 [配置](https://rsbuild.dev/zh/config/)、 [插件 API](https://rsbuild.dev/zh/plugins/dev/) 和 [JavaScript API](https://rsbuild.dev/zh/api/start/) 来灵活地扩展 Rsbuild。

### Vite

Rsbuild 与 Vite 有许多相似之处，它们皆致力于提升前端的开发体验。其主要区别在于：

- **生态兼容性**：Rsbuild 兼容大部分的 webpack 插件和所有 Rspack 插件，而 Vite 则是兼容 Rollup 插件。如果你目前更多地使用了 webpack 生态的插件和 loaders，那么迁移到 Rsbuild 是相对容易的。
- **生产一致性**：Rsbuild 在开发阶段和生产构建均使用 Rspack 进行打包，因此开发和生产构建的产物具备较强的一致性，这也是 Vite 通过 [Rolldown](https://rolldown.rs/) 想要实现的目标之一。
- **模块联邦**：Rsbuild 团队与 [Module Federation](https://rsbuild.dev/zh/guide/advanced/module-federation) 的开发团队密切合作，并为 Module Federation 提供一流的支持，帮助你开发微前端架构的大型 Web 应用。

## 🚀 性能

Rsbuild 的构建性能与原生 Rspack 处于同一水平，以下是构建 1000 个 React 组件的时间：

![benchmark](https://github.com/web-infra-dev/rsbuild/assets/7237365/2909b68f-8928-49c6-8eb3-cd1486dbf876)

> 以上数据来自 [performance-compare](https://github.com/rspack-contrib/performance-compare) benchmark。

## 🔥 特性

Rsbuild 具备以下特性：

- **易于配置**：Rsbuild 的目标之一，是为 Rspack 用户提供开箱即用的构建能力，使开发者能够在零配置的情况下开发 web 项目。同时，Rsbuild 提供一套语义化的构建配置，以降低 Rspack 配置的学习成本。

- **性能优先**：Rsbuild 集成了社区中基于 Rust 的高性能工具，包括 [Rspack](https://rspack.dev)，[SWC](https://swc.rs/) 和 [Lightning CSS](https://lightningcss.dev/)，以提供一流的构建速度和开发体验。

- **插件生态**：Rsbuild 内置一个轻量级的插件系统，提供一系列高质量的官方插件。此外，Rsbuild 兼容大部分的 webpack 插件和所有的 Rspack 插件，这意味着你可以在 Rsbuild 中使用社区或公司内沉淀的现有插件，而无须重写相关代码。

- **产物稳定**：Rsbuild 设计时充分考虑了构建产物的稳定性，它的开发和生产构建产物具备较强的一致性，并自动完成语法降级和 polyfill 注入。Rsbuild 也提供插件来进行 TypeScript 类型检查和产物语法检查，以避免线上代码的质量问题和兼容性问题。

- **框架无关**：Rsbuild 不与前端 UI 框架耦合，并通过插件来支持 React、Vue 3、Vue 2、Svelte、Solid、Lit 等框架，未来也计划支持社区中更多的 UI 框架。

## 🎯 定位

除了作为一个构建工具使用，Rsbuild 也为上层的解决方案提供通用的构建能力，比如 [Rspress](https://github.com/web-infra-dev/rspress) 和 [Modern.js](https://github.com/web-infra-dev/modern.js)，使他们能够专注于开发自己领域特定的能力。

下图说明了 Rsbuild 与生态中其他工具之间的关系：

![Rspack Ecosystem](https://github.com/web-infra-dev/rsbuild/assets/7237365/1ec93ad6-b8b1-475b-963f-cba1e7d79dec)

## 📚 快速上手

你可以参考 [快速上手](https://rsbuild.dev/zh/guide/start/quick-start) 来开始体验 Rsbuild。

## 🦀 链接

- [Rspack](https://github.com/web-infra-dev/rspack)：基于 Rust 的高性能打包工具。
- [Rspress](https://github.com/web-infra-dev/rspress)：基于 Rsbuild 的静态站点生成器。
- [Rsdoctor](https://github.com/web-infra-dev/rsdoctor)：针对 Rspack 和 Webpack 的一站式构建分析工具。
- [Modern.js](https://github.com/web-infra-dev/modern.js)：基于 Rsbuild 的渐进式 React 框架。
- [awesome-rspack](https://github.com/web-infra-dev/awesome-rspack)：与 Rspack 和 Rsbuild 相关的精彩内容列表。
- [rspack-examples](https://github.com/rspack-contrib/rspack-examples)：Rspack、Rsbuild、Rspress 和 Rsdoctor 的示例项目。
- [storybook-rsbuild](https://github.com/rspack-contrib/storybook-rsbuild): 基于 Rsbuild 构建的 Storybook。
- [rsbuild-plugin-template](https://github.com/rspack-contrib/rsbuild-plugin-template)：使用此模板创建你的 Rsbuild 插件。
- [rsfamily-design-resources](https://github.com/rspack-contrib/rsfamily-design-resources)：Rspack、Rsbuild、Rspress 和 Rsdoctor 的设计资源。

## 🤝 参与贡献

> 欢迎参与 Rsbuild 贡献！

请阅读 [贡献指南](https://github.com/web-infra-dev/rsbuild/blob/main/CONTRIBUTING.md) 来共同参与 Rsbuild 的建设。

### 贡献者

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

### 行为准则

本仓库采纳了字节跳动的开源项目行为准则。请点击 [行为准则](./CODE_OF_CONDUCT.md) 查看更多的信息。

## 🧑‍💻 社区

欢迎加入我们的 [Discord](https://discord.gg/XsaKEEk4mW) 交流频道！Rspack / Rsbuild 团队和用户都在那里活跃，并且我们一直期待着各种贡献。

你也可以加入 [飞书群](https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=3c3vca77-bfc0-4ef5-b62b-9c5c9c92f1b4) 与大家一起交流。

## 🌟 质量

Rsbuild 通过 [Web Infra QoS](https://web-infra-qos.netlify.app?product=rsbuild&metrics=bundle-size) 来观测核心指标的变化情况，比如 bundle size、compile speed 和 install size。

## 🙏 致谢

Rsbuild 的一些实现参考了社区中杰出的项目，对他们表示感谢：

- 部分插件的实现参考了 [create-react-app](https://github.com/facebook/create-react-app)。
- 部分 util 函数参考了 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)。
- 部分 API 的设计参考了 [vite](https://github.com/vitejs/vite)。

Rsbuild 网站由 [Netlify](https://www.netlify.com/) 提供支持。

## 📖 License

Rsbuild 项目基于 [MIT 协议](https://github.com/web-infra-dev/rsbuild/blob/main/LICENSE)，请自由地享受和参与开源。
