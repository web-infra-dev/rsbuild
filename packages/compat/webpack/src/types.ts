import type webpack from 'webpack';
import type { WebpackChain } from '@rsbuild/shared';
import type { Configuration as WebpackConfig } from 'webpack';
import type {
  Context as BaseContext,
  RsbuildConfig,
  NormalizedConfig,
  RsbuildPluginAPI,
} from '@rsbuild/shared';
import type { Hooks } from './core/initHooks';

/** The inner context. */
export type Context = BaseContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current Rsbuild config. */
  config: Readonly<RsbuildConfig>;
  /** The original Rsbuild config passed from the createRsbuild method. */
  originalConfig: Readonly<RsbuildConfig>;
  /** The normalized Rsbuild config. */
  normalizedConfig?: NormalizedConfig;
  /** The plugin API. */
  pluginAPI?: RsbuildPluginAPI;
};

export type { webpack, WebpackChain, WebpackConfig };
