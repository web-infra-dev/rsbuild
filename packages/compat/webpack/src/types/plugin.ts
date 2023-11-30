import type {
  DefaultRsbuildPluginAPI,
  RsbuildPlugin as BaseRsbuildPlugin,
} from '@rsbuild/shared';
import type { WebpackConfig } from '..';

export interface RsbuildPluginAPI
  extends DefaultRsbuildPluginAPI<WebpackConfig> {}

export type RsbuildPlugin = BaseRsbuildPlugin<RsbuildPluginAPI>;
