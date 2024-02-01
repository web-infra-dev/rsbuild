import { color, castArray, createVirtualModule } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';
import type { EntryDescription } from '@rspack/core';

export const pluginEntry = (): RsbuildPlugin => ({
  name: 'rsbuild:entry',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isServer, isServiceWorker }) => {
      const { entry } = api.context;
      const config = api.getNormalizedConfig();
      const { preEntry } = config.source;

      const injectCoreJsEntry =
        config.output.polyfill === 'entry' && !isServer && !isServiceWorker;

      Object.keys(entry).forEach((entryName) => {
        const entryPoint = chain.entry(entryName);
        const addEntry = (item: string | EntryDescription) => {
          entryPoint.add(item);
        };

        preEntry.forEach(addEntry);

        if (injectCoreJsEntry) {
          addEntry(createVirtualModule('import "core-js";'));
        }

        castArray(entry[entryName]).forEach(addEntry);
      });
    });

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
