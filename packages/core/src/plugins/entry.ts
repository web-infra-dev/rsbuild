import { castArray, color } from '@rsbuild/shared';
import type { EntryDescription } from '@rspack/core';
import { createVirtualModule } from '../helpers';
import type { RsbuildPlugin } from '../types';

export const pluginEntry = (): RsbuildPlugin => ({
  name: 'rsbuild:entry',

  setup(api) {
    api.modifyBundlerChain(async (chain, { environment, isServer }) => {
      const config = api.getNormalizedConfig({ environment });
      const { preEntry } = config.source;
      const { entry } = api.context.environments[environment];

      const injectCoreJsEntry = config.output.polyfill === 'entry' && !isServer;

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
