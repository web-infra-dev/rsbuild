import { join } from 'path';
import {
  isFileExists,
  TS_CONFIG_FILE,
  createContextByConfig,
  type CreateBuilderOptions,
  NormalizedSharedOutputConfig,
  SharedBuilderConfig,
  BundlerType,
  BuilderContext as BaseContext,
} from '@rsbuild/shared';

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext<
  Context extends BaseContext & {
    hooks: Hooks;
    config: Config;
    originalConfig: Config;
    tsconfigPath?: string;
  },
  Config extends SharedBuilderConfig = Context['config'],
  Hooks = Context['hooks'],
>({
  builderOptions,
  userBuilderConfig,
  initHooks,
  bundlerType,
  initBuilderConfig,
  validateBuilderConfig,
}: {
  builderOptions: Required<CreateBuilderOptions>;
  userBuilderConfig: Config;
  initHooks: () => Hooks;
  initBuilderConfig: () => Config;
  validateBuilderConfig: (data: unknown) => Promise<unknown>;
  bundlerType: BundlerType;
}): Promise<Context> {
  const builderConfig = initBuilderConfig();
  const context = createContextByConfig(
    builderOptions,
    (
      builderConfig as {
        output: NormalizedSharedOutputConfig;
      }
    ).output,
    bundlerType,
  );

  await validateBuilderConfig(builderConfig);

  const tsconfigPath = join(context.rootPath, TS_CONFIG_FILE);

  return {
    ...context,
    hooks: initHooks(),
    config: { ...builderConfig },
    originalConfig: userBuilderConfig,
    tsconfigPath: (await isFileExists(tsconfigPath)) ? tsconfigPath : undefined,
  } as Context;
}
