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
  /**
   * The current action type.
   * - dev: will be set when running `rsbuild dev` or `rsbuild.startDevServer()`
   * - build: will be set when running `rsbuild build` or `rsbuild.build()`
   * - preview: will be set when running `rsbuild preview` or `rsbuild.preview()`
   */
  action?: 'dev' | 'build' | 'preview';
  /**
   * The bundler type, can be `rspack` or `webpack`.
   */
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
};
