# Plugin System

Rsbuild provides developers with a lightweight but powerful plugin system to build itself and any other plugins.
Developing plugins to change the Rsbuild's behavior and introduce extra features. such as:

- Modify config of bundlers.
- Resolve and handle new file types.
- Modify and compile file modules.
- Deploy your application.

Rsbuild can use Rspack as the bundler, expose unified Node.js API, and integrate into different frameworks. Users can painlessly switch between bundlers.

## Write a plugin

Plugin module should export an entry function just like `(options?: PluginOptions) => RsbuildPlugin`, It is recommended to name plugin functions `pluginXXX`.

```ts
import type { RsbuildPlugin } from '@rsbuild/core';

export interface PluginFooOptions {
  message?: string;
}

export const pluginFoo = (options?: PluginFooOptions): RsbuildPlugin => ({
  name: 'plugin-foo',
  setup(api) {
    api.onExit(() => {
      const msg = options.message || 'finish.';
      console.log(msg);
    });
  },
});

rsbuild.addPlugins([pluginFoo('some other message.')]);
```

The function usually **takes an options object** and **returns the plugin instance**, which manages state through closures.

Let's look at each part:

- `name` is used to label the plugin
- `setup` as the main entry point of plugins
- `api` provides context object, lifetime hooks and utils.

The package name of the plugin needs to contain the conventional `plugin-` prefix for identification, just like `plugin-foo`, `@scope/plugin-bar`, etc.

## Lifetime Hooks

Rsbuild uses lifetime planning work internally, and plugins can also register hooks to take part in any stage of the workflow and implement their own features.

The full list of Rsbuild's lifetime hooks can be found in the [API References](/plugins/dev/hooks).

The Rsbuild does not take over the hooks of the underlying bundlers, whose documents can be found here: [webpack hooks](https://webpack.js.org/api/compiler-hooks/)

## Use Rsbuild Config

Custom plugins can usually get config from function parameters,
just define and use it at your pleasure.

But sometimes you may need to read and change the public config of the Rsbuild. To begin with, you should understand how the Rsbuild generates and uses its config:

- Read, parse config and merge with default values.
- Plugins modify the config by `api.modifyRsbuildConfig(...)`.
- Normalize the config and provide it to consume, then the config can no longer be modified.

Refer to this tiny example:

```ts
export const pluginUploadDist = (): RsbuildPlugin => ({
  name: 'plugin-upload-dist',
  setup(api) {
    api.modifyRsbuildConfig((config) => {
      // try to disable minimize.
      // should deal with optional value by self.
      config.output ||= {};
      config.output.disableMinimize = true;
      // but also can be enable by other plugins...
    });
    api.onBeforeBuild(() => {
      // use the normalized config.
      const config = api.getNormalizedConfig();
      if (!config.output.disableMinimize) {
        // let it crash when enable minimize.
        throw new Error(
          'You must disable minimize to upload readable dist files.',
        );
      }
    });
    api.onAfterBuild(() => {
      const config = api.getNormalizedConfig();
      const distRoot = config.output.distPath.root;
      // TODO: upload all files in `distRoot`.
    });
  },
});
```

There are 3 ways to use Rsbuild config:

- register callback with `api.modifyRsbuildConfig(config => {})` to modify config.
- use `api.getRsbuildConfig()` to get Rsbuild config.
- use `api.getNormalizedConfig()` to get finally normalized config.

When normalized, it will again merge the config object with the default values
and make sure the optional properties exist.
So for PluginUploadDist, part of its type looks like:

```ts
api.modifyRsbuildConfig((config: RsbuildConfig) => {});
api.getRsbuildConfig() as RsbuildConfig;
type RsbuildConfig = {
  output?: {
    disableMinimize?: boolean;
    distPath?: { root?: string };
  };
};

api.getNormalizedConfig() as NormalizedConfig;
type NormalizedConfig = {
  output: {
    disableMinimize: boolean;
    distPath: { root: string };
  };
};
```

The return value type of `getNormalizedConfig()` is slightly different from that of `RsbuildConfig` and is narrowed compared to the types described elsewhere in the documentation.
You don't need to fill in the defaults when you use it.

Therefore, the best way to use configuration options is to

- **Modify the config** with `api.modifyRsbuildConfig(config => {})`
- Read `api.getNormalizedConfig()` as the **actual config used by the plugin** in the further lifetime.

## Modify webpack Config

Plugins can handle webpack's config by:

- use `api.modifyWebpackChain(chain => {})` to modify webpack-chain.
- use `api.modifyWebpackConfig(config => {})` to modify raw webpack config.
- use `api.onAfterCreateCompiler(compiler => {})` to handle webpack instance directly.

We recommend that you use [neutrinojs/webpack-chain](https://github.com/neutrinojs/webpack-chain)'s
chained api to handle the config of webpack whenever possible.

Rsbuild integrated a webpack5-compatible version,
which can be found in [sorrycc/webpack-chain](https://github.com/sorrycc/webpack-chain).

## Examples

### Modify Loaders

The webpack loaders can be used to load and transform various file types. For more information, see [concepts](https://webpack.js.org/concepts/loaders) and [loaders](https://webpack.js.org/loaders/).

```ts
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginTypeScriptExt = (): RsbuildPlugin => ({
  name: 'plugin-typescript-ext',
  setup(api) {
    api.modifyWebpackChain(async (chain) => {
      // set ts-loader to recognize more files as typescript modules.
      chain.module.rule(CHAIN_ID.RULE.TS).test(/\.(ts|mts|cts|tsx|tss|tsm)$/);
    });
  },
});
```

### Add Entry Points

```ts
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginAdminPanel = (): RsbuildPlugin => ({
  name: 'plugin-admin-panel',
  setup(api) {
    api.modifyWebpackChain(async (chain) => {
      config.entry('admin-panel').add('src/admin/panel.js');
    });
  },
});
```

### Register Rspack or Webpack Plugin

You can register Rspack or Webpack plugins in the Rsbuild plugin. For example, to register the `eslint-webpack-plugin`:

```ts
import type { RsbuildPlugin } from '@rsbuild/core';
import ESLintPlugin from 'eslint-webpack-plugin';

export const pluginEslint = (options?: Options): RsbuildPlugin => ({
  name: 'plugin-eslint',
  setup(api) {
    // Use bundler-chain to register a bundler plugin.
    api.modifyBundlerChain(async (chain) => {
      chain.plugin('eslint-webpack-plugin').use(ESLintPlugin, [
        {
          // plugins options
        },
      ]);
    });
  },
});
```
