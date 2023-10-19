import type {
  DefaultRsbuildPluginAPI,
  RsbuildPlugin as BaseRsbuildPlugin,
} from '@rsbuild/shared';
import type { RsbuildConfig, NormalizedConfig } from './config';
import type { ModifyRspackConfigFn } from './hooks';
import type { Compiler, MultiCompiler, RspackConfig } from './rspack';

export interface RsbuildPluginAPI
  extends DefaultRsbuildPluginAPI<
    RsbuildConfig,
    NormalizedConfig,
    RspackConfig,
    Compiler | MultiCompiler
  > {
  modifyRspackConfig: (fn: ModifyRspackConfigFn) => void;
}

export type RsbuildPlugin = BaseRsbuildPlugin<RsbuildPluginAPI>;
