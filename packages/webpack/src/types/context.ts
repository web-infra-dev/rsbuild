import type { Context as BaseContext } from '@rsbuild/shared';
import type { Hooks } from '../core/initHooks';
import type { RsbuildConfig, NormalizedConfig } from './config';
import type { RsbuildPluginAPI } from './plugin';

/** The inner context. */
export type Context = BaseContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current builder config. */
  config: Readonly<RsbuildConfig>;
  /** The async task to validate schema of config. */
  configValidatingTask: Promise<void>;
  /** The original builder config passed from the createRsbuild method. */
  originalConfig: Readonly<RsbuildConfig>;
  /** The normalized builder config. */
  normalizedConfig?: NormalizedConfig;
  /** The plugin API. */
  pluginAPI?: RsbuildPluginAPI;
};
