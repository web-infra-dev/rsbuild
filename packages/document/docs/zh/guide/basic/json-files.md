# 引用 JSON 文件

Rsbuild 支持在代码中引用 JSON 文件，也支持引用 [YAML](https://yaml.org/) 和 [TOML](https://toml.io/en/) 文件并将其转换为 JSON 格式。

## JSON 文件

你可以直接在 JavaScript 文件中引用 JSON 文件。

### 示例

```json title="example.json"
{
  "name": "foo",
  "items": [1, 2]
}
```

```js title="index.js"
import example from './example.json';

console.log(example.name); // 'foo';
console.log(example.items); // [1, 2];
```

### 具名引用

Rsbuild 同样支持通过 named import 来引用 JSON 文件：

```js
import { name } from './example.json';

console.log(name); // 'foo';
```

## YAML 文件

YAML 是一种数据序列化语言，通常用于编写配置文件。

你可以直接在 JavaScript 中引用 `.yaml` 或 `.yml` 文件，它们会被自动转换为 JSON 格式。

### 示例

```yaml title="example.yaml"
---
hello: world
foo:
  bar: baz
```

```js
import example from './example.yaml';

console.log(example.hello); // 'world';
console.log(example.foo); // { bar: 'baz' };
```

## TOML 文件

[TOML](https://toml.io/) 是一种语义明显、易于阅读的配置文件格式。

Rsbuild 提供了 [Toml 插件](/plugins/list/plugin-toml)，在注册插件后，你可以在 JavaScript 中引用 `.toml` 文件，它会被自动转换为 JavaScript 对象。

### 示例

```toml title="example.toml"
hello = "world"

[foo]
bar = "baz"
```

```js
import example from './example.toml';

console.log(example.hello); // 'world';
console.log(example.foo); // { bar: 'baz' };
```

## 类型声明

当你在 TypeScript 代码中引用 YAML 或 TOML 文件时，请在项目中创建 `src/env.d.ts` 文件，并添加相应的类型声明。

- 方法一：如果项目里安装了 `@rsbuild/core` 包，你可以直接引用 `@rsbuild/core` 提供的类型声明：

```ts title="src/env.d.ts"
/// <reference types="@rsbuild/core/types" />
```

- 方法二：手动添加需要的类型声明：

```ts title="src/env.d.ts"
declare module '*.yaml' {
  const content: Record<string, any>;
  export default content;
}
declare module '*.yml' {
  const content: Record<string, any>;
  export default content;
}
declare module '*.toml' {
  const content: Record<string, any>;
  export default content;
}
```
