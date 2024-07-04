import {
  type CreateAsyncHook,
  type ModifyBundlerChainFn,
  type ModifyBundlerChainUtils,
  type RsbuildContext,
  type RsbuildEntry,
  type Rspack,
  RspackChain,
  type RspackConfig,
} from '@rsbuild/shared';
import { castArray, isPlainObject } from './helpers';
import { logger } from './logger';
import type { RsbuildConfig } from './types';

export function getBundlerChain(): RspackChain {
  const bundlerChain = new RspackChain();

  return bundlerChain as unknown as RspackChain;
}

export async function modifyBundlerChain(
  context: RsbuildContext & {
    hooks: {
      modifyBundlerChain: CreateAsyncHook<ModifyBundlerChainFn>;
    };
    config: Readonly<RsbuildConfig>;
  },
  utils: ModifyBundlerChainUtils,
): Promise<RspackChain> {
  logger.debug('modify bundler chain');

  const bundlerChain = getBundlerChain();

  const [modifiedBundlerChain] = await context.hooks.modifyBundlerChain.call(
    bundlerChain,
    utils,
  );

  if (utils.environment.config.tools?.bundlerChain) {
    for (const item of castArray(utils.environment.config.tools.bundlerChain)) {
      await item(modifiedBundlerChain, utils);
    }
  }

  logger.debug('modify bundler chain done');

  return modifiedBundlerChain;
}

export function chainToConfig(chain: RspackChain): RspackConfig {
  const config = chain.toConfig();
  const { entry } = config;

  if (!isPlainObject(entry)) {
    return config as RspackConfig;
  }

  const formattedEntry: RsbuildEntry = {};

  /**
   * rspack-chain can not handle entry description object correctly,
   * so we need to format the entry object and correct the entry description object.
   */
  for (const [entryName, entryValue] of Object.entries(entry)) {
    const entryImport: string[] = [];
    let entryDescription: Rspack.EntryDescription | null = null;

    for (const item of castArray(entryValue)) {
      if (typeof item === 'string') {
        entryImport.push(item);
        continue;
      }

      if (item.import) {
        entryImport.push(...castArray(item.import));
      }

      if (entryDescription) {
        // merge entry description object
        Object.assign(entryDescription, item);
      } else {
        entryDescription = item;
      }
    }

    formattedEntry[entryName] = entryDescription
      ? {
          ...entryDescription,
          import: entryImport,
        }
      : entryImport;
  }

  config.entry = formattedEntry;

  return config as RspackConfig;
}
