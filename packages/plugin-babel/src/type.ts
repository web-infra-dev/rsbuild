import type {
  ChainedConfig,
  BabelTransformOptions,
  BabelConfigUtils,
} from '@rsbuild/shared';

export type PluginBabelOptions = ChainedConfig<
  BabelTransformOptions,
  BabelConfigUtils
>;
