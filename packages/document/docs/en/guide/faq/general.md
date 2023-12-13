# General FAQ

### What is the relationship between Rsbuild and Rspack?

Rspack is the base bundler for Rsbuild. The goal of Rsbuild is to provide out-of-the-box building capabilities for Rspack users, allowing developers to start a web project with zero configuration.

The main differences between Rspack and Rsbuild are:

- Rspack projects need to be configured from scratch, while Rsbuild provides default best practice configurations and supports extending Rspack configurations.
- Rspack projects require integration with loaders and plugins from the community to support different scenarios, while Rsbuild provides official plugins and default support for common frontend frameworks and build capabilities.
- The capabilities of Rspack CLI are comparable to Webpack CLI, with relatively streamlined functionality, while Rsbuild provides a more powerful CLI and a more complete dev server.

---

### What is the relationship between Rsbuild and Modern.js?

Modern.js is a progressive web development framework built on top of Rsbuild. The building capabilities of Modern.js are based on Rsbuild.

The main differences between Modern.js and Rsbuild are:

- Modern.js is based on React, while Rsbuild is not coupled with any frontend UI framework.
- Modern.js is a full-stack solution, providing runtime and server-side capabilities, while Rsbuild is a build tool with other capabilities extendable through plugins.
- Modern.js has more built-in features, while Rsbuild pursues lightweight and flexibility.

---

### Can Rsbuild be used to build libraries or UI components?

Rsbuild focuses on solving web application building scenarios. We do not recommend using Rsbuild to build libraries or UI components.

If you need to build a library or UI components, it is recommended to use the [Modern.js Module](https://modernjs.dev/module-tools/en).
