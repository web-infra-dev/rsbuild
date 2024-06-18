import { isAbsolute, join } from 'node:path';
import type {
  BundlerType,
  RsbuildContext,
  RsbuildTarget,
} from '@rsbuild/shared';
import { withDefaultConfig } from './config';
import { ROOT_DIST_DIR } from './constants';
import { initHooks } from './initHooks';
import { logger } from './logger';
import { getEntryObject } from './plugins/entry';
import type {
  CreateRsbuildOptions,
  InternalContext,
  NormalizedConfig,
  RsbuildConfig,
} from './types';

function getAbsolutePath(root: string, filepath: string) {
  return isAbsolute(filepath) ? filepath : join(root, filepath);
}

function getAbsoluteDistPath(
  cwd: string,
  config: RsbuildConfig | NormalizedConfig,
) {
  const dirRoot = config.output?.distPath?.root ?? ROOT_DIST_DIR;
  return getAbsolutePath(cwd, dirRoot);
}

/**
 * Create context by config.
 */
async function createContextByConfig(
  options: Required<CreateRsbuildOptions>,
  bundlerType: BundlerType,
  config: RsbuildConfig = {},
): Promise<RsbuildContext> {
  const { cwd } = options;
  const rootPath = cwd;
  const distPath = getAbsoluteDistPath(cwd, config);
  const cachePath = join(rootPath, 'node_modules', '.cache');
  const tsconfigPath = config.source?.tsconfigPath;

  return {
    entry: getEntryObject(config, 'web'),
    targets: config.output?.targets || [],
    version: RSBUILD_VERSION,
    rootPath,
    distPath,
    cachePath,
    bundlerType,
    tsconfigPath: tsconfigPath
      ? getAbsolutePath(rootPath, tsconfigPath)
      : undefined,
  };
}

export function updateContextByNormalizedConfig(
  context: RsbuildContext,
  config: NormalizedConfig,
) {
  context.targets = config.output.targets as RsbuildTarget[];
  context.distPath = getAbsoluteDistPath(context.rootPath, config);

  if (config.source.entry) {
    context.entry = getEntryObject(config, 'web');
  }

  if (config.source.tsconfigPath) {
    context.tsconfigPath = getAbsolutePath(
      context.rootPath,
      config.source.tsconfigPath,
    );
  }
}

export function createPublicContext(
  context: RsbuildContext,
): Readonly<RsbuildContext> {
  const exposedKeys = [
    'entry',
    'targets',
    'version',
    'rootPath',
    'distPath',
    'devServer',
    'cachePath',
    'configPath',
    'tsconfigPath',
    'bundlerType',
  ];

  // Using Proxy to get the current value of context.
  return new Proxy(context, {
    get(target, prop: keyof RsbuildContext) {
      if (exposedKeys.includes(prop)) {
        return target[prop];
      }
      return undefined;
    },
    set(_, prop: keyof RsbuildContext) {
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
export async function createContext(
  options: Required<CreateRsbuildOptions>,
  userRsbuildConfig: RsbuildConfig,
  bundlerType: BundlerType,
): Promise<InternalContext> {
  const rsbuildConfig = await withDefaultConfig(options.cwd, userRsbuildConfig);
  const context = await createContextByConfig(
    options,
    bundlerType,
    rsbuildConfig,
  );

  return {
    ...context,
    hooks: initHooks(),
    config: { ...rsbuildConfig },
    originalConfig: userRsbuildConfig,
  };
}
