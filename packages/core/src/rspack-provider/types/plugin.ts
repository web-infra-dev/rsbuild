import type {
  RsbuildConfig,
  NormalizedConfig,
  DefaultRsbuildPluginAPI,
  RsbuildPlugin as BaseRsbuildPlugin,
} from '@rsbuild/shared';
import type {
  RspackConfig,
  RspackCompiler,
  RspackMultiCompiler,
} from '@rsbuild/shared';

export interface RsbuildPluginAPI
  extends DefaultRsbuildPluginAPI<
    RsbuildConfig,
    NormalizedConfig,
    RspackConfig,
    RspackCompiler | RspackMultiCompiler
  > {}

export type RsbuildPlugin = BaseRsbuildPlugin<RsbuildPluginAPI>;
