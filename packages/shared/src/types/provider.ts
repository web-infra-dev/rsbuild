import type { Compiler, MultiCompiler } from '@rspack/core';
import type { NormalizedConfig } from './config';
import type { RsbuildMode } from './rsbuild';
import type { RspackConfig } from './rspack';
import type { WebpackConfig } from './thirdParty';

export type Bundler = 'rspack' | 'webpack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  compiler?: Compiler | MultiCompiler;
  getPortSilently?: boolean;
};

export type CreateDevServerOptions = StartDevServerOptions & {
  /**
   * Whether to trigger Rsbuild compilation
   *
   * @default true
   */
  runCompile?: boolean;
};

export type PreviewServerOptions = {
  getPortSilently?: boolean;
};

export type BuildOptions = {
  mode?: RsbuildMode;
  watch?: boolean;
  compiler?: Compiler | MultiCompiler;
};

export type InspectConfigOptions = {
  env?: RsbuildMode;
  verbose?: boolean;
  outputPath?: string;
  writeToDisk?: boolean;
};

export type InspectConfigResult<B extends 'rspack' | 'webpack' = 'rspack'> = {
  rsbuildConfig: string;
  bundlerConfigs: string[];
  origin: {
    rsbuildConfig: NormalizedConfig & {
      pluginNames: string[];
    };
    bundlerConfigs: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
  };
};

export type CreateCompiler =
  // Allow user to manually narrow Compiler type
  <C = Compiler | MultiCompiler>(options?: CreateCompilerOptions) => Promise<C>;
