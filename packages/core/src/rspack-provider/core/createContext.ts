import { join } from 'path';
import {
  isFileExists,
  TS_CONFIG_FILE,
  createContextByConfig,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import { initHooks } from './initHooks';
import { withDefaultConfig } from '../config/defaults';
import type { Context, RsbuildConfig } from '../../types';

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<CreateRsbuildOptions>,
  userRsbuildConfig: RsbuildConfig,
): Promise<Context> {
  const rsbuildConfig = withDefaultConfig(userRsbuildConfig);
  const context = createContextByConfig(
    options,
    'rspack',
    rsbuildConfig.source,
    rsbuildConfig.output,
  );

  const tsconfigPath = join(context.rootPath, TS_CONFIG_FILE);

  return {
    ...context,
    hooks: initHooks(),
    config: { ...rsbuildConfig },
    originalConfig: userRsbuildConfig,
    tsconfigPath: (await isFileExists(tsconfigPath)) ? tsconfigPath : undefined,
  };
}
