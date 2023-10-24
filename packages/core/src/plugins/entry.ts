import { DefaultRsbuildPlugin } from '@rsbuild/shared';
import _ from 'lodash';

export const pluginEntry = (): DefaultRsbuildPlugin => ({
  name: 'plugin-entry',

  setup(api) {
    api.modifyBundlerChain(async (chain) => {
      const { entry } = api.context;
      const { preEntry } = api.getNormalizedConfig().source;

      Object.keys(entry).forEach((entryName) => {
        const appendEntry = (file: string) => chain.entry(entryName).add(file);
        preEntry.forEach(appendEntry);
        _.castArray(entry[entryName]).forEach(appendEntry);
      });
    });
  },
});
