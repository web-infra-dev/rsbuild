# 通用类问题

### Rsbuild 和 Rspack 的关系？

Rspack 是 Rsbuild 底层的打包工具。Rsbuild 的目标是为 Rspack 用户提供开箱即用的构建能力，使开发者能够在零配置的情况下启动一个 web 项目。

---

### Rsbuild 和 Modern.js 的关系？

Modern.js 是基于 Rsbuild 实现的渐进式 Web 开发框架，Modern.js 的构建能力是基于 Rsbuild 实现的。

---

### Rsbuild 能否用于构建工具库或组件库？

Rsbuild 专注于解决 Web 应用构建场景，我们不推荐你使用 Rsbuild 来构建工具库或组件库。

如果需要构建工具库或组件库，推荐使用 [Modern.js Module 解决方案](https://modernjs.dev/module-tools)。
