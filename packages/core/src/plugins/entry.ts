import { castArray, color } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginEntry = (): RsbuildPlugin => ({
  name: 'plugin-entry',

  setup(api) {
    api.modifyBundlerChain(async (chain) => {
      const { entry } = api.context;
      const { preEntry } = api.getNormalizedConfig().source;

      Object.keys(entry).forEach((entryName) => {
        const appendEntry = (file: string) => chain.entry(entryName).add(file);
        preEntry.forEach(appendEntry);
        castArray(entry[entryName]).forEach(appendEntry);
      });
    });

    api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
      if (bundlerConfigs.every((config) => !config.entry)) {
        throw new Error(
          `Could not find any entry module, please make sure that ${color.cyan(
            `src/index.(ts|js|tsx|jsx|mjs|cjs)`,
          )} exists, or customize entry through the ${color.cyan(
            `source.entry`,
          )} configuration.`,
        );
      }
    });
  },
});
