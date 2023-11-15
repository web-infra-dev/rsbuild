import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';
import {
  Context,
  SourceConfig,
  OutputConfig,
  CreateRsbuildOptions,
  BundlerType,
} from './types';
import { findExists, getAbsoluteDistPath } from './fs';

function getDefaultEntry(root: string) {
  const files = ['ts', 'tsx', 'js', 'jsx'].map((ext) =>
    join(root, `src/index.${ext}`),
  );

  const entryFile = findExists(files);

  if (entryFile) {
    return {
      index: entryFile,
    };
  }

  throw new Error(
    'Could not find the entry file, please make sure that `src/index.(js|ts|tsx|jsx)` exists, or customize entry through the `source.entry` configuration.',
  );
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
  const { cwd, target, configPath } = options;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');

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
    srcPath,
    rootPath,
    distPath,
    cachePath,
    bundlerType,
  };

  if (configPath && existsSync(configPath)) {
    context.configPath = configPath;
  }

  return context;
}

export function createPublicContext(context: Context): Readonly<Context> {
  const exposedKeys = [
    'entry',
    'target',
    'srcPath',
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
    set(target, prop: keyof Context) {
      logger.error(
        `Context is readonly, you can not assign to the "context.${prop}" prop.`,
      );
      return true;
    },
  });
}
