import { join } from 'path';
import {
  debug,
  isFileExists,
  TS_CONFIG_FILE,
  type CreateRsbuildOptions,
  createContextByConfig,
  NormalizedSharedOutputConfig,
} from '@rsbuild/shared';
import { initHooks } from './initHooks';
import { validateRsbuildConfig } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import type { Context, RsbuildConfig } from '../types';

/**
 * Create primary context.
 * It will be assembled into a normal context or a stub for testing as needed.
 * Usually it would be a pure function
 */
export function createPrimaryContext(
  options: Required<CreateRsbuildOptions>,
  userRsbuildConfig: RsbuildConfig,
): Context {
  const builderConfig = withDefaultConfig(userRsbuildConfig);
  const context = createContextByConfig(
    options,
    builderConfig.output as NormalizedSharedOutputConfig,
    'webpack',
  );
  const configValidatingTask = Promise.resolve();

  return {
    ...context,
    hooks: initHooks(),
    configValidatingTask,
    config: { ...builderConfig },
    originalConfig: userRsbuildConfig,
  };
}

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<CreateRsbuildOptions>,
  builderConfig: RsbuildConfig,
): Promise<Context> {
  debug('create context');

  await validateRsbuildConfig(builderConfig);
  const ctx = createPrimaryContext(options, builderConfig);

  const tsconfigPath = join(ctx.rootPath, TS_CONFIG_FILE);
  if (await isFileExists(tsconfigPath)) {
    ctx.tsconfigPath = tsconfigPath;
  }

  return ctx;
}
