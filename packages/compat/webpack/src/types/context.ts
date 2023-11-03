import type { Context as BaseContext } from '@rsbuild/shared';
import type { Hooks } from '../core/initHooks';
import type { RsbuildConfig, NormalizedConfig } from './config';
import type { RsbuildPluginAPI } from './plugin';

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
