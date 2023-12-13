# 通用类问题

### Rsbuild 和 Rspack 的关系？

Rspack 是 Rsbuild 底层的打包工具。Rsbuild 的目标是为 Rspack 用户提供开箱即用的构建能力，使开发者能够在零配置的情况下启动一个 web 项目。

Rspack 和 Rsbuild 的主要区别在于：

- Rspack 项目需要从零开始配置；Rsbuild 默认提供了最佳实践的配置，并支持扩展 Rspack 配置。
- Rspack 项目需要接入社区中的 loaders 和 plugins 来支持各种场景；Rsbuild 提供官方插件，默认支持常见的前端框架和构建能力。
- Rspack CLI 的能力对标 Webpack CLI，功能比较精简；而 Rsbuild 提供更强大的 CLI 和更完善的 dev server。

---

### Rsbuild 和 Modern.js 的关系？

Modern.js 是基于 Rsbuild 实现的渐进式 Web 开发框架，它基于 Rsbuild 提供构建能力。

Modern.js 和 Rsbuild 的主要区别在于：

- Modern.js 是基于 React 的；而 Rsbuild 不与前端 UI 框架耦合。
- Modern.js 是全栈解决方案，提供运行时和服务端能力；Rsbuild 是构建工具，其他能力可以通过插件进行扩展。
- Modern.js 内置了更多功能；Rsbuild 则更加追求轻量和灵活性。

---

### Rsbuild 能否用于构建工具库或组件库？

Rsbuild 专注于解决 Web 应用构建场景，我们不推荐使用 Rsbuild 来构建工具库或组件库。

如果需要构建工具库或组件库，推荐使用 [Modern.js Module 解决方案](https://modernjs.dev/module-tools)。
