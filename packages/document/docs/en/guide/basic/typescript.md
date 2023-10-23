# Use TypeScript

Rsbuild supports TypeScript compilation and type checking by default, you can use `. ts` and `. tsx' files in the project without any configuration.

## TypeScript compilation

Rsbuild has three ways to compile TypeScript files.

**Babel**

By default, all TypeScript files are compiled by Babel.

You may find some old articles pointing out that Babel cannot handle `const enum` and `namespace alias` syntax, however since version [7.15](https://babeljs.io/blog/2021/07/26/7.15.0) Babel has supported them. Babel compile is enabled by default.

If you want more Babel plugins

**ts-loader**

The ts-loader uses TypeScript's official compiler-TSC under the hood. When ts-loader is enabled, TypeScript files will no longer be compiled by Babel, but Babel will still inject polyfill into the TSC output and transform it to the lower version of JavaScript.

Enable ts-loader(with default options):

```ts
export default {
  tools: {
    tsLoader: {},
  },
};
```

More configuration can be found at [tools.tsLoader](/config/options/tools.html#toolstsloader).

If ts-loader is enabled with default configuration, it does not have type checking, we do type checking by [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).

**SWC**

If you want a super fast compiler, and you don't need some custom Babel plugins, then you can use SWC for compilation and minification.

SWC plugin in Rsbuild supports TypeScript, TSX and legacy decorator, you can check [SWC plugin](/plugins/list/plugin-swc.html).

### Why Babel is the default option

Babel supports TypeScript well. It cannot check types, but we can check types in another process. Babel follows standards more when compiled to lower versions of JavaScript in certain situations. For example, Babel will initialize class members as undefined, and mark class methods as non-enumerable. If TSC is enabled, for better syntax downgrading and Polyfill, the TSC output will still be compiled by Babel, causing unnecessary performance costs.

## Type Checking

Rsbuild provides the Type Check plugin, which allows running TypeScript type checking in a separate process. The plugin internally integrates [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).

Please refer to the [Type Check plugin](/plugins/list/plugin-type-check.html) for usage details.
