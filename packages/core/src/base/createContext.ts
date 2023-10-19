import { join } from 'path';
import {
  isFileExists,
  TS_CONFIG_FILE,
  type CreateBuilderOptions,
  NormalizedSharedOutputConfig,
  SharedBuilderConfig,
  BundlerType,
  BuilderContext,
  logger,
  getAbsoluteDistPath,
} from '@rsbuild/shared';
import { existsSync } from 'fs';

/**
 * Create context by config.
 */
function createContextByConfig(
  options: Required<CreateBuilderOptions>,
  outputConfig: NormalizedSharedOutputConfig,
  bundlerType: BundlerType,
): BuilderContext {
  const { cwd, target, configPath, framework } = options;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');

  const distPath = getAbsoluteDistPath(cwd, outputConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');

  const context: BuilderContext = {
    entry: options.entry,
    target,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    framework,
    bundlerType,
  };

  if (configPath && existsSync(configPath)) {
    context.configPath = configPath;
  }

  return context;
}

export function createPublicContext(
  context: BuilderContext,
): Readonly<BuilderContext> {
  const exposedKeys = [
    'entry',
    'target',
    'srcPath',
    'rootPath',
    'distPath',
    'devServer',
    'framework',
    'cachePath',
    'configPath',
    'tsconfigPath',
    'bundlerType',
  ];

  // Using Proxy to get the current value of context.
  return new Proxy(context, {
    get(target, prop: keyof BuilderContext) {
      if (exposedKeys.includes(prop)) {
        return target[prop];
      }
      return undefined;
    },
    set(_target, prop: keyof BuilderContext) {
      logger.error(
        `Context is readonly, you can not assign to the "context.${prop}" prop.`,
      );
      return true;
    },
  });
}

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext<
  Context extends BuilderContext & {
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
