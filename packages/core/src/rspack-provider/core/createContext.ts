import { join } from 'path';
import {
  isFileExists,
  TS_CONFIG_FILE,
  createContextByConfig,
  type CreateRsbuildOptions,
  NormalizedSharedOutputConfig,
} from '@rsbuild/shared';
import { initHooks } from './initHooks';
import { validateRsbuildConfig } from '../config/validate';
import { withDefaultConfig } from '../config/defaults';
import type { Context, RsbuildConfig } from '../types';

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<CreateRsbuildOptions>,
  userRsbuildConfig: RsbuildConfig,
): Promise<Context> {
  const builderConfig = withDefaultConfig(userRsbuildConfig);
  const context = createContextByConfig(
    options,
    builderConfig.output as NormalizedSharedOutputConfig,
    'rspack',
  );
  const configValidatingTask = Promise.resolve();

  await validateRsbuildConfig(builderConfig);

  const tsconfigPath = join(context.rootPath, TS_CONFIG_FILE);

  return {
    ...context,
    hooks: initHooks(),
    configValidatingTask,
    config: { ...builderConfig },
    originalConfig: userRsbuildConfig,
    tsconfigPath: (await isFileExists(tsconfigPath)) ? tsconfigPath : undefined,
  };
}
