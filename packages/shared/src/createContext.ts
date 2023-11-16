import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';
import type {
  Context,
  BundlerType,
  SourceConfig,
  OutputConfig,
  RsbuildEntry,
  NormalizedConfig,
  CreateRsbuildOptions,
} from './types';
import { findExists, getAbsoluteDistPath } from './fs';

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

/**
 * Create context by config.
 */
export function createContextByConfig(
  options: Required<CreateRsbuildOptions>,
  bundlerType: BundlerType,
  sourceConfig: SourceConfig = {},
  outputConfig: OutputConfig = {},
): Context {
  const { cwd, target } = options;
  const rootPath = cwd;

  const distPath = getAbsoluteDistPath(cwd, outputConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');

  if (sourceConfig.entries) {
    logger.warn(
      '[Rsbuild] `source.entries` option has been renamed to `source.entry`, please update the Rsbuild config.',
    );
    logger.warn(
      '[Rsbuild] `source.entries` option will be removed in Rsbuild v0.2.0.',
    );
  }

  const context: Context = {
    entry:
      sourceConfig.entry ||
      // TODO: remove sourceConfig.entries in v0.2.0
      // compat with previous config
      sourceConfig.entries ||
      getDefaultEntry(rootPath),
    target,
    rootPath,
    distPath,
    cachePath,
    bundlerType,
  };

  return context;
}

export function updateContextByNormalizedConfig(
  context: Context,
  config: NormalizedConfig,
) {
  context.distPath = getAbsoluteDistPath(context.rootPath, config.output);

  if (config.source.entry) {
    context.entry = config.source.entry;
  }
}

export function createPublicContext(context: Context): Readonly<Context> {
  const exposedKeys = [
    'entry',
    'target',
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
    get(target, prop: keyof Context) {
      if (exposedKeys.includes(prop)) {
        return target[prop];
      }
      return undefined;
    },
    set(_, prop: keyof Context) {
      logger.error(
        `Context is readonly, you can not assign to the "context.${prop}" prop.`,
      );
      return true;
    },
  });
}
