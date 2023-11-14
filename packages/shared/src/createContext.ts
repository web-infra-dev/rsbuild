import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';
import {
  Context,
  CreateRsbuildOptions,
  NormalizedOutputConfig,
  BundlerType,
} from './types';
import { getAbsoluteDistPath } from './fs';

/**
 * Create context by config.
 */
export function createContextByConfig(
  options: Required<CreateRsbuildOptions>,
  outputConfig: NormalizedOutputConfig,
  bundlerType: BundlerType,
): Context {
  const { cwd, target, configPath } = options;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');

  const distPath = getAbsoluteDistPath(cwd, outputConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');

  const context: Context = {
    entry: options.entry,
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
