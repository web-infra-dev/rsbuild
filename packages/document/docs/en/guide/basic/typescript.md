# Use TypeScript

Rsbuild supports TypeScript by default, allowing you to directly use `.ts` and `.tsx` files in your projects.

## TypeScript Transpilation

Rsbuild uses SWC by default for transpiling TypeScript code, and it also supports switching to Babel for transpilation.

Unlike the native TypeScript compiler, tools like SWC and Babel compile each file separately and cannot determine whether an imported name is a type or a value. Therefore, when using TypeScript in Rsbuild, you need to enable the [isolatedModules](https://www.typescriptlang.org/tsconfig/#isolatedModules) option in your `tsconfig.json` file:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "isolatedModules": true
  }
}
```

This option can help you avoid using certain syntax that cannot be correctly compiled by SWC and Babel, such as cross-file type references. It will guide you to correct the corresponding usage:

```ts
// Wrong
export { SomeType } from './types';

// Correct
export type { SomeType } from './types';
```

## Type Checking

When transpiling TypeScript code using tools like SWC and Babel, type checking is not performed.

Rsbuild provides the Type Check plugin, which runs TypeScript type checking in a separate process. The plugin internally integrates [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).

Please refer to the [Type Check plugin](/plugins/list/plugin-type-check) for usage instructions.
