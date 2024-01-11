import { join, isAbsolute } from 'path';
import {
  logger,
  findExists,
  getDistPath,
  isFileExists,
  TS_CONFIG_FILE,
  type BundlerType,
  type RsbuildEntry,
  type RsbuildConfig,
  type RsbuildTarget,
  type RsbuildContext,
  type NormalizedConfig,
  type CreateRsbuildOptions,
} from '@rsbuild/shared';
import type { InternalContext } from '../../types';
import { initHooks } from './initHooks';
import { withDefaultConfig } from '../config';

function getDefaultEntry(root: string): RsbuildEntry {
  const files = [
    // Most projects are using typescript now.
    // So we put `.ts` as the first one to improve performance.
    'ts',
    'js',
    'tsx',
    'jsx',
    '.mjs',
    '.cjs',
  ].map((ext) => join(root, `src/index.${ext}`));

  const entryFile = findExists(files);

  if (entryFile) {
    return {
      index: entryFile,
    };
  }

  return {};
}

function getAbsoluteDistPath(
  cwd: string,
  config: RsbuildConfig | NormalizedConfig,
) {
  const root = getDistPath(config, 'root');
  return isAbsolute(root) ? root : join(cwd, root);
}

/**
 * Create context by config.
 */
export function createContextByConfig(
  options: Required<CreateRsbuildOptions>,
  bundlerType: BundlerType,
  config: RsbuildConfig = {},
): RsbuildContext {
  const { cwd } = options;
  const rootPath = cwd;
  const distPath = getAbsoluteDistPath(cwd, config);
  const cachePath = join(rootPath, 'node_modules', '.cache');

  const context: RsbuildContext = {
    entry: config.source?.entry || getDefaultEntry(rootPath),
    targets: config.output?.targets || [],
    version: RSBUILD_VERSION,
    rootPath,
    distPath,
    cachePath,
    bundlerType,
  };

  return context;
}

export function updateContextByNormalizedConfig(
  context: RsbuildContext,
  config: NormalizedConfig,
) {
  context.targets = config.output.targets as RsbuildTarget[];
  context.distPath = getAbsoluteDistPath(context.rootPath, config);

  if (config.source.entry) {
    context.entry = config.source.entry;
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
  const rsbuildConfig = withDefaultConfig(userRsbuildConfig);
  const context = createContextByConfig(options, bundlerType, rsbuildConfig);

  const tsconfigPath = join(context.rootPath, TS_CONFIG_FILE);

  return {
    ...context,
    hooks: initHooks(),
    config: { ...rsbuildConfig },
    originalConfig: userRsbuildConfig,
    tsconfigPath: (await isFileExists(tsconfigPath)) ? tsconfigPath : undefined,
  };
}
