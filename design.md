# 旧 CSS 配置到 Rspack 内置 CSS 配置的映射

开启 `css: true` 或 `css: { ... }` 时，Rsbuild 会自动将旧版 CSS 配置转换为对应的 Rspack 内置 CSS 配置；显式配置的 `css.*` 字段优先生效。

## 一、配置映射表

| 旧配置                                                         | 内部对应的 Rspack 新配置                                                                                                                                           | 说明                                                                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `output.cssModules.auto: true`（默认，且 `mode !== 'global'`） | `rule.type = 'css/auto'`                                                                                                                                           | 默认按 Rspack 原生 `.module.*` / `.modules.*` 自动识别 CSS Modules。                                                                             |
| `output.cssModules.auto: true` 且 `mode === 'global'`          | `rule.type = 'css'` + `rule.rules: [{ resource: /\.module(s)?\.\w+$/i, type: 'css/global' }]`                                                                      | 仅对 `.module.*` / `.modules.*` 启用 `'css/global'`，其余保持 `'css'`。                                                                          |
| `output.cssModules.auto: false`                                | `rule.type = 'css'`                                                                                                                                                | 所有 CSS 按普通全局样式处理，不启用 CSS Modules。                                                                                                |
| `output.cssModules.auto: RegExp \| Function`                   | `rule.type = 'css'` + `rule.rules: [{ resource: auto, type: mode === 'global' ? 'css/global' : 'css/module' }]`                                                    | 当 `auto` 为函数时，在 `resource` 条件中仅接收 `resourcePath`，后两个参数传 `''`。                                                               |
| `output.cssModules.mode: 'local'`                              | `rule.type = 'css/auto'`（`auto: true`）或 `'css/module'`（自定义 `auto`）                                                                                         | 与 Rspack 默认 local 语义一致。                                                                                                                  |
| `output.cssModules.mode: 'global'`                             | 子规则 `type = 'css/global'`                                                                                                                                       | 匹配 CSS Modules 条件的文件按 `'css/global'` 编译。                                                                                              |
| `output.cssModules.mode: 'pure'`                               | `module.parser['css/auto'].pure = true`、`module.parser['css/module'].pure = true`                                                                                 | `'css/global'` 不支持 `pure`。                                                                                                                   |
| `output.cssModules.mode: (resourcePath) => mode`               | 不支持                                                                                                                                                             | 输出警告并回退为 `'local'`。                                                                                                                     |
| `output.cssModules.mode: 'icss'`                               | 不支持                                                                                                                                                             | 输出警告并回退为 `'local'`。                                                                                                                     |
| `output.cssModules.namedExport`                                | `module.parser.{css, 'css/auto', 'css/global', 'css/module'}.namedExports`                                                                                         | 默认值 `false` 不会覆盖 `exportType` 为 `'text'` / `'css-style-sheet'` 时的默认 `true`。                                                         |
| `output.cssModules.exportLocalsConvention`                     | `module.generator.{'css/auto', 'css/global', 'css/module'}.exportsConvention`                                                                                      | 枚举映射：`asIs` → `as-is`、`camelCase` → `camel-case`、`camelCaseOnly` → `camel-case-only`、`dashes` → `dashes`、`dashesOnly` → `dashes-only`。 |
| `output.cssModules.localIdentName`                             | `module.generator.{'css/auto', 'css/global', 'css/module'}.{localIdentName, localIdentHashFunction, localIdentHashDigest, localIdentHashDigestLength}`             | 将 `[fn:hash:digest:length]` 拆分为 `[hash]` / `[fullhash]` 与独立选项，其中 `base64` 映射为 `base64url`。                                       |
| `output.cssModules.exportGlobals`                              | 不支持                                                                                                                                                             | 为 `true` 时输出一次警告。                                                                                                                       |
| `output.emitCss`                                               | `module.generator.{css, 'css/auto', 'css/global', 'css/module'}.exportsOnly = !emitCss`                                                                            | 为 `false` 时主规则附加 `parser.url = false` 与 `ignoreCssLoader`，并跳过 `output.cssFilename`、PostCSS 与 Lightning CSS。                       |
| `output.injectStyles: true`                                    | `module.parser.{css, 'css/auto', 'css/global', 'css/module'}.exportType = 'style'`                                                                                 | `false` 时保持默认 `'link'`（不在 parser 上显式写入 `'link'`）。                                                                                 |
| `?inline`                                                      | `resourceQuery: /[?&]inline(?:&\|=\|$)/`、`type: 'css'`、`parser: { exportType: 'text', namedExports: true }`、`generator: { exportsOnly: false, esModule: true }` | 始终导出经过处理的纯文本 CSS 字符串。                                                                                                            |
| `?raw` / `with { type: 'text' }`                               | `type: 'asset/source'`                                                                                                                                             | 直接作为原始字符串资源导入。                                                                                                                     |
| `?url`                                                         | `cssUrlLoader`（`builtinCss: true`），子编译器内 `type: 'css'`、移除 `parser.exportType`、强制 `generator.*.exportsOnly = false`                                   | CSS Modules 文件禁止使用 `?url`；非模块化文件通过子编译器产出独立 `.css` 资产并返回 URL。                                                        |

## 二、无法一一对应的配置：`css-loader` 的 `filter` 迁移到 `externals`

Rspack 内置 CSS 的 `module.parser.<css*>.url` 只支持 `boolean`，不支持 `css-loader` 的 `url.filter(url, resourcePath)` 函数。若需要跳过特定 `url(...)`（例如保留运行时静态路径，不交给打包器处理），需迁移到 Rspack 的 `externals` 机制。

> **建议：** 优先使用等价的**正则表达式**形式配置，尽量避免使用函数形式的 `externals`。函数形式会在每次模块解析时触发 Rust ↔ JS 跨语言调用，带来额外构建开销；而正则表达式可以直接在 Rust 侧完成匹配。

### 旧配置（`tools.cssLoader`）

```ts
export default {
  tools: {
    cssLoader: {
      url: {
        filter: (url, resourcePath) => !url.startsWith('/static/'),
      },
    },
  },
};
```

### 新配置（推荐：正则 + `rspack.ExternalsPlugin`）

```ts
import { rspack } from '@rsbuild/core';

export default {
  css: true,
  tools: {
    rspack: {
      plugins: [new rspack.ExternalsPlugin('asset-url', /^\/static\//)],
    },
  },
};
```

注意事项：

- 正则形式的 external 会继承当前 `ExternalsPlugin` 的 `externalsType`（无法在单条规则上写 `'asset-url ...'` 前缀）。因此不要直接写裸配置 `output: { externals: [/^\/static\//] }`——在默认 `externalsType`（`'var'` / `'module-import'`）下，这会把匹配到的资源当成 JS external 处理而报错。通过 `new rspack.ExternalsPlugin('asset-url', /^\/static\//)` 可以只对这组正则规则指定 `'asset-url'`，不影响已有的其他 `output.externals`（若项目中没有其他 JS external，也可以改用顶层 `externalsType: 'asset-url'` 配合 `output.externals: [/^\/static\//]`，但独立插件实例更安全）。
- 同理，`tools.cssLoader.import.filter` 若需保留外部 `@import`，优先使用正则形式：`new rspack.ExternalsPlugin('css-import', /^\/static\/.*\.css$/)`。如果 `@import` 与 `url(...)` 共用同一个前缀，请将匹配 `.css` 的 `css-import` 插件排在 `asset-url` 之前（或使用互不重叠的正则），同时确保正则足够精确，避免误匹配 JS 导入。

### 兜底方案（仅当正则无法表达时使用函数形式）

仅当必须根据 `contextInfo.issuer`（对应原 `resourcePath`）、`dependencyType` 或动态条件判断时，才在顶层 `output.externals` 中使用函数形式：

```ts
export default {
  css: true,
  output: {
    externals: [
      ({ request, dependencyType, contextInfo }) => {
        if (
          dependencyType === 'url' &&
          contextInfo?.issuer &&
          /\.(?:css|less|s[ac]ss)$/i.test(contextInfo.issuer) &&
          request?.startsWith('/static/')
        ) {
          return `asset-url ${request}`;
        }
      },
    ],
  },
};
```

返回 `` `asset-url ${request}` `` 后，Rspack 会保留该 `url(...)` 路径原样输出而不再作为模块打包。同理，针对 `@import` 场景，若正则无法满足且需要判断 `media`、`supports`、`layer` 或 `resourcePath`，可在 `externals` 中针对 `dependencyType === 'css-import'` 返回 `` `css-import ${request}` ``，或使用 Rspack 的 `module.parser.<css*>.resolveImport` 回调进行过滤。
