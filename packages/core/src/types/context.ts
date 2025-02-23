import type { Hooks } from '../hooks';
import type { NormalizedConfig, RsbuildConfig } from './config';
import type { EnvironmentContext } from './hooks';
import type { RsbuildPluginAPI } from './plugin';

export type BundlerType = 'rspack' | 'webpack';

/** The public context */
export type RsbuildContext = {
  /** The Rsbuild core version. */
  version: string;
  /** The root path of current project. */
  rootPath: string;
  /** Absolute path of output files. */
  distPath: string;
  /** Absolute path of cache files. */
  cachePath: string;
  /** Info of dev server  */
  devServer?: {
    hostname: string;
    port: number;
    https: boolean;
  };
  bundlerType: BundlerType;
};

/** The inner context. */
export type InternalContext = RsbuildContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current Rsbuild config. */
  config: Readonly<RsbuildConfig>;
  /** The original Rsbuild config passed from the createRsbuild method. */
  originalConfig: Readonly<RsbuildConfig>;
  /** The normalized Rsbuild config. */
  normalizedConfig?: NormalizedConfig;
  /**
   * Get the plugin API.
   *
   * When environment is undefined, the global plugin API is returned, which can be used in all environments.
   * */
  getPluginAPI?: (environment?: string) => RsbuildPluginAPI;
  /** The environment context. */
  environments: Record<string, EnvironmentContext>;
  /** Only build specified environment. */
  specifiedEnvironments?: string[];
  /**
   * The command type.
   *
   * - dev: `rsbuild dev` or `rsbuild.startDevServer()`
   * - build: `rsbuild build` or `rsbuild.build()`
   * - preview: `rsbuild preview` or `rsbuild.preview()`
   */
  command?: 'dev' | 'build' | 'preview';
};
