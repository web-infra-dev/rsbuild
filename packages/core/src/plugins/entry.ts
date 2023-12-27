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
        const entryImport: string[] = [];
        let entryDescription: EntryDescription | null = null;

        const appendEntry = (item: string | EntryDescription) => {
          if (typeof item === 'string') {
            entryImport.push(item);
            return;
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
        };

        preEntry.forEach(appendEntry);

        if (injectCoreJsEntry) {
          appendEntry(createVirtualModule('import "core-js";'));
        }

        castArray(entry[entryName]).forEach(appendEntry);

        chain.entryPoints.set(entryName, {
          // @ts-expect-error EntryDescription type mismatch
          values() {
            if (entryDescription) {
              return {
                ...entryDescription,
                import: entryImport,
              };
            }
            return entryImport;
          },
        });
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
