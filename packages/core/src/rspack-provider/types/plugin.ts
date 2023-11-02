import type {
  DefaultRsbuildPluginAPI,
  RsbuildPlugin as BaseRsbuildPlugin,
} from '@rsbuild/shared';
import type { RsbuildConfig, NormalizedConfig } from './config';
import type { ModifyRspackConfigFn } from './hooks';
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
  > {
  modifyRspackConfig: (fn: ModifyRspackConfigFn) => void;
}

export type RsbuildPlugin = BaseRsbuildPlugin<RsbuildPluginAPI>;
