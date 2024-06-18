import {
  type RsbuildEntry,
  type RsbuildTarget,
  castArray,
  color,
} from '@rsbuild/shared';
import type { EntryDescription } from '@rspack/core';
import { createVirtualModule } from '../helpers';
import { reduceConfigsMergeContext } from '../reduceConfigs';
import type { NormalizedConfig, RsbuildConfig, RsbuildPlugin } from '../types';

export function getEntryObject(
  config: RsbuildConfig | NormalizedConfig,
  target: RsbuildTarget,
): RsbuildEntry {
  if (!config.source?.entry) {
    return {};
  }

  return reduceConfigsMergeContext({
    initial: {},
    config: config.source?.entry,
    ctx: { target },
  });
}

export const pluginEntry = (): RsbuildPlugin => ({
  name: 'rsbuild:entry',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { target, isServer, isServiceWorker }) => {
        const config = api.getNormalizedConfig();
        const { preEntry } = config.source;
        const entry =
          target === 'web' ? api.context.entry : getEntryObject(config, target);

        const injectCoreJsEntry =
          config.output.polyfill === 'entry' && !isServer && !isServiceWorker;

        for (const entryName of Object.keys(entry)) {
          const entryPoint = chain.entry(entryName);
          const addEntry = (item: string | EntryDescription) => {
            entryPoint.add(item);
          };

          preEntry.forEach(addEntry);

          if (injectCoreJsEntry) {
            addEntry(createVirtualModule('import "core-js";'));
          }

          castArray(entry[entryName]).forEach(addEntry);
        }
      },
    );

    api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
      if (bundlerConfigs.every((config) => !config.entry)) {
        throw new Error(
          `Could not find any entry module, please make sure that ${color.cyan(
            'src/index.(ts|js|tsx|jsx|mjs|cjs)',
          )} exists, or customize entry through the ${color.cyan(
            'source.entry',
          )} configuration.`,
        );
      }
    });
  },
});
