import { castArray, color, createVirtualModule } from '../helpers';
import type { RsbuildEntryDescription, RsbuildPlugin } from '../types';

export const pluginEntry = (): RsbuildPlugin => ({
  name: 'rsbuild:entry',

  setup(api) {
    api.modifyBundlerChain(async (chain, { environment, isServer }) => {
      const { config, entry } = environment;
      const { preEntry } = config.source;

      const injectCoreJsEntry = config.output.polyfill === 'entry' && !isServer;

      for (const entryName of Object.keys(entry)) {
        const entryPoint = chain.entry(entryName);
        const addEntry = (item: string | RsbuildEntryDescription) => {
          if (typeof item === 'object' && 'html' in item) {
            const { html, ...rest } = item;
            entryPoint.add(rest);
          } else {
            entryPoint.add(item);
          }
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
          `[rsbuild:config] Could not find any entry module, please make sure that ${color.cyan(
            'src/index.(ts|js|tsx|jsx|mts|cts|mjs|cjs)',
          )} exists, or customize entry through the ${color.cyan(
            'source.entry',
          )} configuration.`,
        );
      }
    });
  },
});
