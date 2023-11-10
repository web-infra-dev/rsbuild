import type {
  DefaultRsbuildPluginAPI,
  RsbuildPlugin as BaseRsbuildPlugin,
} from '@rsbuild/shared';
import type { Compiler, MultiCompiler } from 'webpack';
import type { RsbuildConfig, NormalizedConfig } from './config';
import type { WebpackConfig } from './thirdParty';

export interface RsbuildPluginAPI
  extends DefaultRsbuildPluginAPI<
    RsbuildConfig,
    NormalizedConfig,
    WebpackConfig,
    Compiler | MultiCompiler
  > {}

export type RsbuildPlugin = BaseRsbuildPlugin<RsbuildPluginAPI>;
