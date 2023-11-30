import type {
  DefaultRsbuildPluginAPI,
  RsbuildPlugin as BaseRsbuildPlugin,
} from '@rsbuild/shared';
import type { RsbuildConfig, NormalizedConfig } from './config';
import type { WebpackConfig } from '..';

export interface RsbuildPluginAPI
  extends DefaultRsbuildPluginAPI<
    RsbuildConfig,
    NormalizedConfig,
    WebpackConfig
  > {}

export type RsbuildPlugin = BaseRsbuildPlugin<RsbuildPluginAPI>;
