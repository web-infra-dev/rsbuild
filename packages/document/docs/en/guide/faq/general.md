# General FAQ

### The relationship between Rsbuild and Modern.js?

The building abilities of Modern.js are based on Rsbuild.

When developing Modern.js, we designed Rsbuild as an independent module, and clearly divided the responsibilities of Rsbuild and Modern.js. Therefore, Rsbuild can be used independently of the Modern.js framework and be applied to other frameworks or scenarios.

---

### Can Rsbuild be used to build libraries or UI components?

Rsbuild focuses on solving web application building scenarios. We do not recommend that you use Rsbuild to build libraries or UI components.

If you need to build a library or UI components, it is recommended to use the [Modern.js Module](https://modernjs.dev/module-tools/en).

---

### Will Rsbuild support Turbopack?

Rsbuild is already supporting Rspack, and currently Turbopack supports use in Next.js, so there is no plan for Rsbuild to support [Turbopack](https://turbo.build/pack).

> You can find the comparison of Rspack and Turbopack in the [Introduction](https://www.rspack.dev/guide/introduction.html) of Rspack.

---

### Will Rsbuild support Vite?

[Vite](https://vitejs.dev/) is a great tool, but the goal of Rsbuild is to replace webpack with Rust Bundler, Rspack can provide fast compilation speed, while maintaining the consistent behavior between development and production.

Rsbuild will focus on the evolution from webpack to Rspack, so it will not be support Vite.

> You can find the comparison of Vite and Turbopack in the [Introduction](https://www.rspack.dev/guide/introduction.html) of Rspack.
