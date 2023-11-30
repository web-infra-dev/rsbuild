import type {
  ToolsConfig as BaseToolsConfig,
  ChainedConfigWithUtils,
  NormalizedToolsConfig as BaseNormalizedToolsConfig,
} from '@rsbuild/shared';
import type {
  BabelTransformOptions,
  BabelConfigUtils,
} from '@rsbuild/plugin-babel';

export type ToolsBabelConfig = ChainedConfigWithUtils<
  BabelTransformOptions,
  BabelConfigUtils
>;

export interface ToolsConfig extends BaseToolsConfig {
  /**
   * Modify the options of [babel-loader](https://github.com/babel/babel-loader)
   * When `tools.babel`'s type is Function，the default babel config will be passed in as the first parameter, the config object can be modified directly, or a value can be returned as the final result.
   * When `tools.babel`'s type is `Object`, the config will be shallow merged with default config by `Object.assign`.
   * Note that `Object.assign` is a shallow copy and will completely overwrite the built-in `presets` or `plugins` array, please use it with caution.
   */
  babel?: ToolsBabelConfig;
}

export type NormalizedToolsConfig = BaseNormalizedToolsConfig & ToolsConfig;
