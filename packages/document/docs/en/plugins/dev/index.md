# Plugin System

Rsbuild provides a lightweight yet powerful plugin system to implement most of its functionality and allows for user extension.

Plugins written by developers can modify the default behavior of Rsbuild and add various additional features, including but not limited to:

- Modifying Rspack configurations
- Processing new file types
- Modifying or compiling files
- Deploying artifacts

## Developing Plugins

Plugins provide a function similar to `(options?: PluginOptions) => RsbuildPlugin` as an entry point. It is recommended to name the plugin function `pluginXXX` and export it by name.

### Plugin Example

```ts title="pluginFoo.ts"
import type { RsbuildPlugin } from '@rsbuild/core';

export type PluginFooOptions = {
  message?: string;
};

export const pluginFoo = (options: PluginFooOptions = {}): RsbuildPlugin => ({
  name: 'plugin-foo',

  setup(api) {
    api.onAfterStartDevServer(() => {
      const msg = options.message || 'hello!';
      console.log(msg);
    });
  },
});
```

Registering the plugin:

```ts title="rsbuild.config.ts"
import { pluginFoo } from './pluginFoo';

export default {
  plugins: [pluginFoo({ message: 'world!' })],
};
```

### Plugin Structure

Function-based plugins can **accept an options object** and **return a plugin instance**, managing internal state through closures.

The roles of each part are as follows:

- The `name` property is used to label the plugin's name.
- `setup` serves as the main entry point for the plugin logic.
- The `api` object contains various hooks and utility functions.

For easy identification, it is recommended that the plugin's `name` include the conventional `plugin-` prefix, such as `plugin-foo`, `@scope/plugin-bar`, etc.

## Lifetime Hooks

Rsbuild uses lifetime planning work internally, and plugins can also register hooks to take part in any stage of the workflow and implement their own features.

The full list of Rsbuild's lifetime hooks can be found in the [API References](/plugins/dev/hooks).

The Rsbuild does not take over the hooks of the underlying Rspack, whose documents can be found here: [Rspack Plugin API](https://rspack.dev/api/plugin-api)。

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

## Modifying Rspack Configuration

The Rsbuild plugin can modify the configuration of Rspack in various ways.

- `api.modifyRspackConfig(config => {})` modifies the final Rspack configuration.
- `api.modifyBundlerChain(chain => {})` modifies the `bundler-chain`, usage is similar to [webpack-chain](https://github.com/neutrinojs/webpack-chain).
- `api.onAfterCreateCompiler(compiler => {})` directly operates on the Rspack compiler instance.

## Example References

### Modifying Loader

Loaders can read and process different types of file modules, refer to [concepts](https://webpack.js.org/concepts/loaders) and [loaders](https://webpack.js.org/loaders/).

```ts
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginTypeScriptExt = (): RsbuildPlugin => ({
  name: 'plugin-typescript-ext',
  setup(api) {
    api.modifyBundlerChain(async (chain) => {
      // Set ts-loader to recognize more files as typescript modules
      chain.module.rule(CHAIN_ID.RULE.TS).test(/\.(ts|mts|cts|tsx|tss|tsm)$/);
    });
  },
});
```

### Adding Module Entry

```ts
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginAdminPanel = (): RsbuildPlugin => ({
  name: 'plugin-admin-panel',
  setup(api) {
    api.modifyBundlerChain(async (chain) => {
      config.entry('admin-panel').add('src/admin/panel.js');
    });
  },
});
```

### Registering Rspack Plugin

You can register Rspack plugins within Rsbuild plugins, such as registering `eslint-webpack-plugin`:

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
