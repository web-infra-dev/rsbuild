import { join } from 'path';
import {
  debug,
  isFileExists,
  TS_CONFIG_FILE,
  type RsbuildConfig,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import {
  withDefaultConfig,
  createContextByConfig,
} from '@rsbuild/core/rspack-provider';
import { initHooks } from './initHooks';
import type { Context } from '../types';

/**
 * Create primary context.
 * It will be assembled into a normal context or a stub for testing as needed.
 * Usually it would be a pure function
 */
export function createPrimaryContext(
  options: Required<CreateRsbuildOptions>,
  userRsbuildConfig: RsbuildConfig,
): Context {
  const rsbuildConfig = withDefaultConfig(userRsbuildConfig);
  const context = createContextByConfig(
    options,
    'webpack',
    rsbuildConfig.source,
    rsbuildConfig.output,
  );

  return {
    ...context,
    hooks: initHooks(),
    config: { ...rsbuildConfig },
    originalConfig: userRsbuildConfig,
  };
}

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<CreateRsbuildOptions>,
  rsbuildConfig: RsbuildConfig,
): Promise<Context> {
  debug('create context');

  const ctx = createPrimaryContext(options, rsbuildConfig);

  const tsconfigPath = join(ctx.rootPath, TS_CONFIG_FILE);
  if (await isFileExists(tsconfigPath)) {
    ctx.tsconfigPath = tsconfigPath;
  }

  return ctx;
}
