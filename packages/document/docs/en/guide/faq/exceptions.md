# Exceptions FAQ

### Find ESNext code in the compiled files?

By default, Rsbuild does not compile JavaScript files under `node_modules`. If an npm package used in the project contains ESNext syntax, it will be bundled into the output.

When this happens, you can specify directories or modules that need to be compiled additionally through the [source.include](/config/options/source.html#sourceinclude) configuration option.

---

### Compile error `Error: [object Object] is not a PostCSS plugin` ?

Currently, Modern.js is using PostCSS v8. If you encounter the `Error: [object Object] is not a PostCSS plugin` error during the compilation process, it is usually caused by referencing the wrong version of PostCSS, for example, the version of `postcss` (peerDependencies) in `cssnano` does not meet expectations.

You can find the dependencies of `UNMET PEER DEPENDENCY` through `npm ls postcss`, and then install the correct version of dependencies by specifying the PostCSS version in package.json.

```
npm ls postcss

 ├─┬ css-loader@6.3.0
 │ └── UNMET PEER DEPENDENCY postcss@8.3.9
 ├─┬ css-minimizer-webpack-plugin@3.0.0
 │ └── UNMET PEER DEPENDENCY postcss@8.3.9
```

---

### Compile error `You may need additional loader`?

If the following error message is encountered during the compilation process, it means that there are individual files that cannot be compiled correctly.

```bash
Module parse failed: Unexpected token
File was processed with these loaders:
 * some-loader/index.js

You may need an additional loader to handle the result of these loaders.
```

Please check if any file formats not supported by Rsbuild are being referenced, and configure the corresponding Rspack loader to compile them.

---

### Compilation error "export 'foo' (imported as 'foo') was not found in './utils'"?

If you encounter this error during the compilation process, it means that your code is referencing an export that does not exist.

For example, in the following code, `index.ts` is importing the `foo` variable from `utils.ts`, but `utils.ts` only exports the `bar` variable.

```ts
// utils.ts
export const bar = 'bar';

// index.ts
import { foo } from './utils';
```

In this case, Rsbuild will throw the following error:

```bash
Compile Error:
File: ./src/index.ts
export 'foo' (imported as 'foo') was not found in './utils' (possible exports: bar)
```

If you encounter this issue, the first step is to check the import/export statements in your code and correct any invalid code.

There are some common mistakes:

- Importing a non-existent variable:

```ts
// utils.ts
export const bar = 'bar';

// index.ts
import { foo } from './utils';
```

- Re-exporting a type without adding the `type` modifier, causing compilers like Babel to fail in recognizing the type export, resulting in compilation errors.

```ts
// utils.ts
export type Foo = 'bar';

// index.ts
export { Foo } from './utils'; // Incorrect
export type { Foo } from './utils'; // Correct
```

In some cases, the error may be caused by a third-party dependency that you cannot modify directly. In this situation, if you are sure that the issue does not affect your application, you can add the following configuration to change the log level from `error` to `warn`:

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

However, it is important to contact the developer of the third-party dependency immediately to fix the issue.

> You can refer to the webpack documentation for more details on [module.parser.javascript.exportsPresence](https://webpack.js.org/configuration/module/#moduleparserjavascriptexportspresence).

---

### The webpack cache does not work?

Rsbuild enables webpack's persistent cache by default.

After the first compilation is completed, the cache file will be automatically generated and output to the `./node_modules/.cache/webpack` directory. When the second compilation is performed, the cache is hit and the compilation speed is greatly improved.

When configuration files such as `package.json` are modified, the cache is automatically invalidated.

If the webpack compilation cache in the project has not taken effect, you can add the following configuration for troubleshooting:

```ts
export default {
  tools: {
    webpack(config) {
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        debug: /webpack\.cache/,
      };
    },
  },
};
```

After adding the above configuration, webpack will output logs for debugging. Please refer to the logs related to `PackFileCacheStrategy` to understand the cause of cache invalidation.

---

### Tree shaking does not take effect?

Rsbuild will enable the tree shaking function of webpack by default during production construction. Whether tree shaking can take effect depends on whether the business code can meet the tree shaking conditions of webpack.

If you encounter the problem that tree shaking does not take effect, you can check whether the `sideEffects` configuration of the relevant npm package is correct. If you don't know what `sideEffects` is, or are interested in the principles behind tree shaking, you can read the following two documents:

- [webpack official documentation - Tree Shaking](https://webpack.docschina.org/guides/tree-shaking/)
- [Tree Shaking Troubleshooting Guide](https://bytedance.feishu.cn/docs/doccn8E1ldDct5uv1EEDQs8Ycwe)

---

### JavaScript heap out of memory when compiling?

This error indicates that there is a memory overflow problem during the packaging process. In most cases, it is because the bundled content exceeds the default memory limit of Node.js.

In case of OOM issues, the easiest way to fix this is by increasing the memory cap, Node.js provides the `--max-old-space-size` option to set this. You can set this parameter by adding [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions) before the CLI command.

For example, add parameters before the `modern build` command:

```diff title="package.json"
{
   "scripts": {
- "build": "modern build"
+ "build": "NODE_OPTIONS=--max_old_space_size=16384 modern build"
   }
}
```

If you are executing other commands, such as `modern deploy`, please add parameters before the corresponding command.

The value of the `max_old_space_size` parameter represents the upper limit of the memory size (MB). Generally, it can be set to `16384` (16GB).

The following parameters are explained in more detail in the official Node.js documentation:

- [NODE_OPTIONS](https://nodejs.org/api/cli.html#node_optionsoptions)
- [--max-old-space-size](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)

In addition to increasing the memory limit, it is also a solution to improve efficiency by enabling some compilation strategies, please refer to [Improve Build Performance](/guide/optimization/build-performance).

If the above methods cannot solve your problem, it may be that some abnormal logic in the project has caused memory overflow. You can debug recent code changes and locate the root cause of problems. If it cannot be located, please contact us.

---

### Can't resolve 'core-js/modules/xxx.js' when compiling?

If you get an error similar to the following when compiling, it means that [core-js](https://github.com/zloirock/core-js) cannot be resolved properly in the project.

```bash
Module not found: Can't resolve 'core-js/modules/es.error.cause.js'
```

Usually, you don't need to install `core-js` in the project, because the Rsbuild already has a built-in `core-js` v3.

If there is an error that `core-js` cannot be found, there may be several reasons:

1. The current project overrides the built-in `alias` configuration of Rsbuild, causing the incorrect resolution of the `core-js` path when referenced. In this case, you can check the `alias` configuration of the project.
2. Some code in the project depends on `core-js` v2. In this case, you usually need to find out the corresponding code and upgrade `core-js` to the v3.
3. An npm package in `node_modules` imported `core-js`, but does not declare the `core-js` dependency in `dependencies`. In this case, you need to declare the `core-js` dependency in the corresponding npm package, or install a copy of `core-js` in the project root directory.

---

### Compilation error after referencing a type from lodash

If the `@types/lodash` package is installed in your project, you may import some types from `lodash`, such as the `DebouncedFunc` type:

```ts
import { debounce, DebouncedFunc } from 'lodash';
```

Rsbuild will throw an error after compiling the above code:

```bash
Syntax error: /project/src/index.ts: The lodash method `DebouncedFunc` is not a known module.
Please report bugs to https://github.com/lodash/babel-plugin-lodash/issues.
```

The reason is that Rsbuild has enabled the [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash) plugin by default to optimize the bundle size of lodash, but Babel cannot distinguish between "value" and "type", which resulting in an exception in the compiled code.

The solution is to use TypeScript's `import type` syntax to explicitly declare the `DebouncedFunc` type:

```ts
import { debounce } from 'lodash';
import type { DebouncedFunc } from 'lodash';
```

:::tip
In any case, it is recommended to use `import type` to import types, this will help the compiler to identify the type.
:::

---

### Division in Less file doesn't work?

Compared with the v3 version, the Less v4 version has some differences in the way of writing division:

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

The built-in Less version of Rsbuild is v4, and the writing method of the lower version will not take effect. Please pay attention to the distinction.

The writing of division in Less can also be modified through configuration options, see [Less - Math](https://lesscss.org/usage/#less-options-math).

---

### Compile error ‘TypeError: Cannot delete property 'xxx' of #\<Object\>’

This error indicates that a read-only configuration option was deleted during the compilation process. Normally, we do not want any operation to directly modify the incoming configuration when compiling, but it is difficult to restrict the behavior of underlying plugins (such as postcss-loader, etc). If this error occurs, please contact the Rsbuild developer and we will need to do something special with that configuration.

The same type of error is also reported:

- 'TypeError: Cannot add property xxx, object is not extensible'
- 'TypeError: Cannot assign to read only property 'xxx' of object '#\<Object\>'
