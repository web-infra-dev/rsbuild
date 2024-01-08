# Import JSON Files

Rsbuild supports import JSON files in code, and also supports import [YAML](https://yaml.org/) and [Toml](https://toml.io/en/) files and converting them to JSON format.

## JSON file

You can import JSON files directly in JavaScript files.

### Example

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

### Named Import

Rsbuild also supports importing JSON files via named import:

```js
import { name } from './example.json';

console.log(name); // 'foo';
```

## YAML file

YAML is a data serialization language commonly used for writing configuration files.

You can directly import `.yaml` or `.yml` files in JavaScript and they will be automatically converted to JSON format.

### Example

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

## Toml file

Toml is a semantically explicit, easy-to-read configuration file format.

You can directly import `.toml` files in JavaScript and it will be automatically converted to JSON format.

### Example

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

## Type Declaration

When you import YAML or Toml files in TypeScript code, please create a `src/env.d.ts` file in your project and add the corresponding type declarations.

- Method 1: If the `@rsbuild/core` package is installed, you can directly reference the type declarations provided by `@rsbuild/core`:

```ts
/// <reference types="@rsbuild/core/types" />
```

- Method 2: Manually add the required type declarations:

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
