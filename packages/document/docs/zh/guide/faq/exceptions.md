# 异常类问题

### 编译产物中存在未编译的 ESNext 代码？

默认情况下，Rsbuild 不会编译 `node_modules` 下的 JavaScript 文件。如果项目引入的 npm 包中含有 ESNext 语法，会被打包进产物中。

遇到这种情况时，可以通过 [source.include](/config/source/include) 配置项来指定需要额外进行编译的目录或模块。

---

### 编译时报错 `You may need additional loader`？

如果编译过程中遇到了以下报错提示，表示存在个别文件无法被正确编译。

```bash
Module parse failed: Unexpected token
File was processed with these loaders:
 * some-loader/index.js

You may need an additional loader to handle the result of these loaders.
```

请检查是否引用了 Rsbuild 不支持的文件格式，并自行配置相应的 Rspack loader 对其进行编译。

---

### 编译时报错 `Error: [object Object] is not a PostCSS plugin` ?

目前，Rsbuild 使用的是 v8 版本的 PostCSS。如果编译过程中遇到了 `Error: [object Object] is not a PostCSS plugin` 报错提示，通常是由于引用到了错误的 PostCSS 版本导致，常见的如 `cssnano` 中 `postcss` (peerDependencies) 版本不符合预期。

可以通过 `npm ls postcss` 查找 `UNMET PEER DEPENDENCY` 的依赖，然后在 package.json 中通过指定 PostCSS 版本等方式安装正确的依赖版本即可。

```
npm ls postcss

 ├─┬ css-loader@6.3.0
 │ └── UNMET PEER DEPENDENCY postcss@8.3.9
 ├─┬ css-minimizer-webpack-plugin@3.0.0
 │ └── UNMET PEER DEPENDENCY postcss@8.3.9
```

---

### 编译时报错 `export 'foo' (imported as 'foo') was not found in './utils'`？

如果编译的过程中出现此报错，说明代码中引用了一个不存在的导出。

比如以下例子，`index.ts` 中引用了 `utils.ts` 中的 `foo` 变量， 但 `utils.ts` 实际上只导出了 `bar` 变量。

```ts
// utils.ts
export const bar = 'bar';

// index.ts
import { foo } from './utils';
```

在这种情况下，Rsbuild 会抛出以下错误：

```bash
Compile Error:
File: ./src/index.ts
export 'foo' (imported as 'foo') was not found in './utils' (possible exports: bar)
```

当你遇到该问题时，首先需要检查相关代码里 import / export 的内容是否正确，并修正相关错误。

常见的错误写法有：

- 引入了不存在的变量：

```ts
// utils.ts
export const bar = 'bar';

// index.ts
import { foo } from './utils';
```

- re-export 了一个类型，但是没有添加 `type` 修饰符，导致 babel 等编译工具无法识别到类型导出，导致编译异常。

```ts
// utils.ts
export type Foo = 'bar';

// index.ts
export { Foo } from './utils'; // 错误写法
export type { Foo } from './utils'; // 正确写法
```

在个别情况下，以上报错是由第三方依赖引入的，你无法直接修改它。此时，如果你确定该问题不影响你的应用，那么可以添加以下配置，将 `error` 日志修改为 `warn` 级别：

```ts
export default {
  tools: {
    bundlerChain(chain) {
      chain.module.parser.merge({
        javascript: {
          exportsPresence: 'warn',
        },
      });
    },
  },
};
```

同时，你需要尽快联系第三方依赖的开发者来修复相应的问题。

> 你可以查看 webpack 的文档来了解 [module.parser.javascript.exportsPresence](https://webpack.js.org/configuration/module/#moduleparserjavascriptexportspresence) 的更多细节。

---

### 打包后发现 tree shaking 没有生效？

Rsbuild 在生产构建时会默认开启 Rspack 的 tree shaking 功能，tree shaking 是否能够生效，取决于业务代码能否满足 Rspack 的 tree shaking 条件。

如果你遇到了 tree shaking 不生效的问题，可以检查下相关 npm 包的 `sideEffects` 配置是否正确，如果你不了解 `sideEffects` 的作用，或是对 tree shaking 背后的原理感兴趣，可以阅读以下两篇文档：

- [Rspack 官方文档 - Tree Shaking](https://rspack.dev/zh/guide/tree-shaking)
- [Tree Shaking 问题排查指南](https://bytedance.feishu.cn/docs/doccn8E1ldDct5uv1EEDQs8Ycwe)

如果你是 npm 包的开发者，可以阅读这篇文章：

- [如何编写一个友好支持 Tree-shaking 的库](https://zhuanlan.zhihu.com/p/594124786)

---

### 打包时出现 `JavaScript heap out of memory`?

该报错表示打包过程中出现了内存溢出问题，大多数情况下是由于打包的内容较多，超出了 Node.js 默认的内存上限。

如果出现 OOM 问题，最简单的方法是通过增加内存上限来解决，Node.js 提供了 `--max-old-space-size` 选项来对此进行设置。你可以在 CLI 命令前添加 [NODE_OPTIONS](https://nodejs.org/api/cli#node_optionsoptions) 来设置此参数。

比如，在 `rsbuild build` 命令前添加参数：

```diff title="package.json"
{
  "scripts": {
-   "build": "rsbuild build"
+   "build": "NODE_OPTIONS=--max_old_space_size=16384 rsbuild build"
  }
}
```

如果你执行的是其他命令，比如 `rsbuild dev`，请在对应的命令前添加参数。

`max_old_space_size` 参数的值代表内存上限大小（MB)，一般情况下设置为 `16384`（16GB）即可。

Node.js 官方文档中有对以下参数更详细的解释：

- [NODE_OPTIONS](https://nodejs.org/api/cli#node_optionsoptions)
- [--max-old-space-size](https://nodejs.org/api/cli#--max-old-space-sizesize-in-megabytes)

除了增加内存上限，通过开启一些编译策略来提升构建效率也是一个解决方案，请参考 [提升构建性能](/guide/optimization/build-performance)。

如果以上方式无法解决你的问题，可能是项目中某些异常逻辑导致了内存非正常溢出。你可以排查近期的代码变更，定位问题的根因。如果无法定位，请联系我们进行排查。

---

### 打包时出现 `Can't resolve 'core-js/modules/xxx.js'`？

如果你在打包时出现了类似下面的报错，表示项目中的 [core-js](https://github.com/zloirock/core-js) 无法被正确引用。

```bash
Module not found: Can't resolve 'core-js/modules/es.error.cause.js'
```

通常来说，你无须在项目中安装 `core-js`，因为 Rsbuild 已经内置了一份 `core-js` v3。

如果出现 `core-js` 找不到的报错，可能有以下几个原因：

1. 当前项目覆盖了 Rsbuild 内置的 `alias` 配置，导致引用 `core-js` 时，没有解析到正确的 `core-js` 路径，这种情况下，你可以检查项目的 `alias` 配置。
2. 项目里某一处代码依赖了 `core-js` v2 版本。这种情况通常需要你找出对应的代码，并升级其中的 `core-js` 到 v3 版本。
3. `node_modules` 中的某一个 npm 包引用了 `core-js`，但是没有在 `dependencies` 中声明 `core-js` 依赖。这种情况需要你在对应的 npm 包中声明 `core-js` 依赖，或者在项目根目录下安装一份 `core-js`。

---

### 从 lodash 中引用类型后出现编译报错？

当你的项目中安装了 `@types/lodash` 包时，你可能会从 `lodash` 中引用一些类型，比如引用 `DebouncedFunc` 类型：

```ts
import { debounce, DebouncedFunc } from 'lodash';
```

上述代码会在编译后产生如下报错：

```bash
SyntaxError: /project/src/index.ts: The 'lodash' method `DebouncedFunc` is not a known module.
Please report bugs to https://github.com/lodash/babel-plugin-lodash/issues.
```

这个问题的原因是 Rsbuild 默认开启了 [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash) 插件来优化 lodash 产物体积，但 Babel 无法区别「值」和「类型」，导致编译后的代码出现异常。

解决方法是使用 TypeScript 的 `import type` 语法，对 `DebouncedFunc` 类型进行显式声明：

```ts
import { debounce } from 'lodash';
import type { DebouncedFunc } from 'lodash';
```

:::tip
在任意情况下，我们都推荐使用 `import type` 来引用类型，这对于编译器识别类型会有很大帮助。
:::

---

### Less 文件中的除法不生效？

Less v4 版本与 v3 版本相比，除法的写法有一些区别：

```less
// Less v3
.math {
  width: 2px / 2; // 1px
  width: 2px ./ 2; // 1px
  width: (2px / 2); // 1px
}

// Less v4
.math {
  width: 2px / 2; // 2px / 2
  width: 2px ./ 2; // 1px
  width: (2px / 2); // 1px
}
```

Rsbuild 内置的 Less 版本为 v4，低版本的写法不会生效，请注意区分。

Less 中除法的写法也可以通过配置项来修改，详见 [Less - Math](https://lesscss.org/usage/#less-options-math)。

---

### 修改配置后，报错 `TypeError: Cannot delete property 'xxx' of #<Object>`

该报错表示在编译过程中对一个只读配置项进行了删除操作。通常情况下，我们不希望编译过程中的任何操作会直接对传入的配置进行修改，但难以限制底层插件（如 postcss-loader 等）的行为，如果出现该报错，请联系 Rsbuild 开发者，我们需要对该配置进行单独处理。

同类型报错还有：

- `TypeError: Cannot add property xxx, object is not extensible`
- `TypeError: Cannot assign to read only property 'xxx' of object '#<Object>`
