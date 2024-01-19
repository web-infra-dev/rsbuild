# 环境变量

Rsbuild 支持在编译过程中向代码中注入环境变量或表达式，这对于区分运行环境、注入常量值等场景很有帮助。本章节会介绍环境变量的使用方式。

## 默认环境变量

### process.env.NODE_ENV

默认情况下，Rsbuild 会自动设置 `process.env.NODE_ENV` 环境变量，在开发模式为 `'development'`，生产模式为 `'production'`。

你可以在 Node.js 和 client 代码中直接使用 `process.env.NODE_ENV`。

```ts
if (process.env.NODE_ENV === 'development') {
  console.log('this is a development log');
}
```

在开发环境，以上代码会被编译为：

```js
if (true) {
  console.log('this is a development log');
}
```

在生产环境，以上代码会被编译为：

```js
if (false) {
  console.log('this is a development log');
}
```

在代码压缩过程中，`if (false) { ... }` 会被识别为无效代码，并被自动移除。

### process.env.ASSET_PREFIX

你可以在 client 代码中使用 `process.env.ASSET_PREFIX` 来访问静态资源的前缀。

- 在开发环境下，它等同于 [dev.assetPrefix](/config/dev/asset-prefix) 设置的值。
- 在生产环境下，它等同于 [output.assetPrefix](/config/output/asset-prefix) 设置的值。
- Rsbuild 会自动移除 `assetPrefix` 尾部的斜线符号，以便于进行字符串拼接。

比如，我们通过 [output.copy](/config/output/copy) 配置，将 `static/icon.png` 图片拷贝到 `dist` 目录下：

```ts
export default {
  dev: {
    assetPrefix: '/',
  },
  output: {
    copy: [{ from: './static', to: 'static' }],
    assetPrefix: 'https://example.com',
  },
};
```

此时，我们可以在 client 代码中通过以下方式来拼接图片 URL：

```jsx
const Image = <img src={`${process.env.ASSET_PREFIX}/static/icon.png`} />;
```

在开发环境，以上代码会被编译为：

```jsx
const Image = <img src={`/static/icon.png`} />;
```

在生产环境，以上代码会被编译为：

```jsx
const Image = <img src={`https://example.com/static/icon.png`} />;
```

## `.env` 文件

当项目根目录存在 `.env` 文件时，Rsbuild 会自动使用 [dotenv](https://npmjs.com/package/dotenv) 来加载这些环境变量，并添加到当前 Node.js 进程中。

### 文件类型

Rsbuild 支持读取以下 env 文件：

| 文件名                   | 描述                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `.env`                   | 在所有场景下默认加载。                                        |
| `.env.local`             | `.env` 文件的本地用法，需要添加到 .gitignore 中。             |
| `.env.development`       | 当 `process.env.NODE_ENV` 为 `'development'` 时读取。         |
| `.env.production`        | 当 `process.env.NODE_ENV` 为 `'production'` 时读取。          |
| `.env.development.local` | `.env.development` 文件的本地用法，需要添加到 .gitignore 中。 |
| `.env.production.local`  | `.env.production` 文件的本地用法，需要添加到 .gitignore 中。  |

如果同时存在上述的多个文件，那么多个文件都会被读取，并且表格下方的文件具有更高的优先级。

### Env 模式

Rsbuild 也支持读取 `.env.[mode]` 和 `.env.[mode].local` 文件，你可以通过 CLI 的 `--env-mode <mode>` 选项来指定 env 模式。

比如，指定 env 模式为 `test`：

```bash
npx rsbuild dev --env-mode test
```

Rsbuild 会依次读取以下文件：

- .env
- .env.local
- .env.test
- .env.test.local

:::tip
`--env-mode` 选项的优先级高于 process.env.NODE_ENV。

推荐使用 `--env-mode` 来指定 env 模式，不建议修改 process.env.NODE_ENV。

:::

### 示例

比如创建 `.env` 文件并添加以下内容：

```shell title=".env"
FOO=hello
BAR=1
```

然后在 `rsbuild.config.ts` 文件中，可以直接访问到上述环境变量：

```ts title="rsbuild.config.ts"
console.log(process.env.FOO); // 'hello'
console.log(process.env.BAR); // '1'
```

此时在创建 `.env.local` 文件，添加以下内容：

```shell title=".env.local"
BAR=2
```

此时 `process.env.BAR` 的值被覆盖为 `'2'`：

```ts title="rsbuild.config.ts"
console.log(process.env.FOO); // 'hello'
console.log(process.env.BAR); // '2'
```

## public 变量

所有以 `PUBLIC_` 开头的环境变量将被自动注入到 client 代码中，比如定义了以下变量：

```bash title=".env"
PUBLIC_NAME=jack
PASSWORD=123
```

在 client 代码的源文件中，可以通过以下方式访问 public 变量：

```ts title="src/index.ts"
console.log(process.env.PUBLIC_NAME); // -> 'jack'
console.log(process.env.PASSWORD); // -> undefined
```

:::tip

- public 变量的内容会出现在你的 client 代码中，请避免在 public 变量中包含敏感信息。
- public 变量是通过 [source.define](/config/source/define) 注入到 client 代码的，请阅读[「使用 define 配置」](#使用-define-配置)来了解 define 的原理和注意事项。

:::

### 自定义前缀

Rsbuild 提供了 [loadEnv](/api/javascript-api/core#loadenv) 方法，可以把任何前缀的环境变量注入到 client 代码中。

比如将一个 Create React App 项目迁移到 Rsbuild 时，你可以通过以下方式来读取 `REACT_APP_` 开头的环境变量，并通过 [source.define](/config/source/define) 配置项注入：

```ts title="rsbuild.config.ts"
import { defineConfig, loadEnv } from '@rsbuild/core';

const { publicVars } = loadEnv({ prefixes: ['REACT_APP_'] });

export default defineConfig({
  source: {
    define: publicVars,
  },
});
```

## 使用 define 配置

通过配置 [source.define](/config/source/define) 选项，你可以在构建时将代码中的变量替换成其它值或者表达式。

define 类似于其它一些语言提供的宏定义能力，但得益于 JavaScript 强大的运行时表达能力，通常不需要像那些语言一样将其用作复杂代码的生成器。它常用于在构建环境向 client 代码传递环境变量等信息，或是辅助进行 Tree Shaking 等操作。

### 替换表达式

define 最基础的用途是在构建时替换代码中的表达式。

例如环境变量 `NODE_ENV` 的值会影响许多第三方模块的行为，在构建线上应用的产物时通常需要将它设置为 `"production"`：

```js
export default {
  source: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  },
};
```

需要注意的是这里提供的值必须是 JSON 字符串，例如 `process.env.NODE_ENV` 的值为 `"production"` 则传入的值应当是 `"\"production\""` 才能够正确被处理。

同理 `{ foo: "bar" }` 也应该被转换成 `"{\"foo\":\"bar\"}"`，如果直接传入原始对象则意味着把表达式 `process.env.NODE_ENV.foo` 替换为标识符 `bar`。

`source.define` 的具体行为请参考 [API 文档](/config/source/define)。

:::tip
以上例子中的环境变量 `NODE_ENV` 已经由 Rsbuild 自动注入，通常你不需要手动配置它的值。
:::

### process.env 注入方式

在使用 `source.define` 时，请避免注入整个 `process.env` 对象，比如下面的用法是不推荐的：

```js
export default {
  source: {
    define: {
      'process.env': JSON.stringify(process.env),
    },
  },
};
```

如果你采用了上述用法，将会导致如下问题：

1. 额外注入了一些未使用的环境变量，导致开发环境的环境变量被泄露到前端代码中。
2. 由于每一处 `process.env` 代码都会被替换为完整的环境变量对象，导致前端代码的包体积增加，性能降低。

因此，请按照实际需求来注入 `process.env` 上的环境变量，避免全量注入。

### 注意事项

需要注意的是，`source.define` 只会匹配完整的表达式，对表达式进行解构会让 Rsbuild 无法正确识别：

```js
console.log(process.env.NODE_ENV);
// => production

const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// => undefined

const vars = process.env;
console.log(vars.NODE_ENV);
// => undefined
```

## 声明环境变量类型

当你在 TypeScript 代码中读取环境变量时，TypeScript 可能会提示该变量缺少类型定义，此时你需要添加相应的类型声明。

比如你引用了一个 `CUSTOM_VAR` 变量，在 TypeScript 文件中会出现如下提示：

```
TS2304: Cannot find name 'CUSTOM_VAR'.
```

此时，你可以在项目中创建 `src/env.d.ts` 文件，并添加以下内容即可：

```ts title="src/env.d.ts"
declare const CUSTOM_VAR: string;
```

## Tree Shaking

Define 还可以用于标记死代码以协助 Rsbuild 进行 Tree Shaking 优化。

例如通过将 `process.env.REGION` 替换为具体值来实现针对不同地区的产物进行差异化构建：

```js
export default {
  source: {
    define: {
      'process.env.REGION': JSON.stringify(process.env.REGION),
    },
  },
};
```

这样设置后对于存在地区控制的代码：

```js
const App = () => {
  if (process.env.REGION === 'cn') {
    return <EntryFoo />;
  } else if (process.env.REGION === 'sg') {
    return <EntryBar />;
  } else {
    return <EntryBaz />;
  }
};
```

指定环境变量 `REGION=sg` 并执行构建得到的产物会被剔除多余的代码：

```js
const App = () => {
  if (false) {
  } else if (true) {
    return <EntryBar />;
  } else {
  }
};
```

未用到的组件不会被打包到产物中，它们的外部依赖也会对应地被优化，最终即可得到体积和性能都更优的产物代码。
