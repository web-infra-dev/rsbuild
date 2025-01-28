import fs from 'node:fs';
import type {
  ChainIdentifier,
  RsbuildPlugin,
  RsbuildProviderHelpers,
  RsbuildTarget,
  Rspack,
  RspackChain,
} from '@rsbuild/core';
import { castArray } from './shared.js';

async function applyTsConfigPathsPlugin({
  chain,
  CHAIN_ID,
  mainFields,
  extensions,
  configFile,
}: {
  chain: RspackChain;
  CHAIN_ID: ChainIdentifier;
  mainFields: (string | string[])[];
  extensions: string[];
  configFile: string;
}) {
  const { TsconfigPathsPlugin } = await import('tsconfig-paths-webpack-plugin');

  chain.resolve
    .plugin(CHAIN_ID.RESOLVE_PLUGIN.TS_CONFIG_PATHS)
    .use(TsconfigPathsPlugin, [
      {
        configFile,
        extensions,
        // https://github.com/dividab/tsconfig-paths-webpack-plugin/pull/106
        mainFields: mainFields as string[],
      },
    ]);
}

function isWebTarget(target: RsbuildTarget | RsbuildTarget[]) {
  const targets = castArray(target);
  return targets.includes('web') || target.includes('web-worker');
}

const getMainFields = (chain: RspackChain, target: RsbuildTarget) => {
  const mainFields = chain.resolve.mainFields.values();

  if (mainFields.length) {
    return mainFields;
  }

  if (isWebTarget(target)) {
    return ['browser', 'module', 'main'];
  }

  return ['module', 'main'];
};

/**
 * Handling differences between webpack and Rspack
 */
export const pluginAdaptor = (
  helpers: RsbuildProviderHelpers,
): RsbuildPlugin => ({
  name: 'rsbuild-webpack:adaptor',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment, target }) => {
      const { config, tsconfigPath } = environment;
      const aliasStrategy =
        config.source.aliasStrategy ?? config.resolve.aliasStrategy;

      if (tsconfigPath && aliasStrategy === 'prefer-tsconfig') {
        await applyTsConfigPathsPlugin({
          chain,
          CHAIN_ID,
          configFile: tsconfigPath,
          mainFields: getMainFields(chain, target),
          extensions: chain.resolve.extensions.values(),
        });
      }

      // enable progress bar for webpack by default
      const progress = config.dev.progressBar ?? true;
      if (progress) {
        const { ProgressPlugin } = await import('./progress/ProgressPlugin.js');
        chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(ProgressPlugin, [
          {
            id: environment.name,
            prettyTime: helpers.prettyTime,
            ...(progress === true ? {} : progress),
          },
        ]);
      }

      const { copy } = config.output;
      if (copy) {
        const { default: CopyPlugin } = await import('copy-webpack-plugin');

        const options: Rspack.CopyRspackPluginOptions = Array.isArray(copy)
          ? { patterns: copy }
          : copy;

        chain.plugin(CHAIN_ID.PLUGIN.COPY).use(CopyPlugin, [
          // @ts-expect-error to type mismatch
          options,
        ]);
      }
    });

    api.modifyWebpackConfig(async (config) => {
      const copyPlugin = config.plugins?.find(
        (item) => item?.constructor.name === 'CopyPlugin',
      ) as unknown as Rspack.CopyRspackPluginOptions;

      if (copyPlugin) {
        // If the pattern.context directory not exists, we should remove CopyPlugin.
        // Otherwise the CopyPlugin will cause the webpack to re-compile.
        const isContextNotExists = copyPlugin.patterns.every(
          (pattern) =>
            typeof pattern !== 'string' &&
            pattern.context &&
            !fs.existsSync(pattern.context),
        );
        if (isContextNotExists) {
          config.plugins = config.plugins?.filter(
            (item) => item?.constructor.name !== 'CopyPlugin',
          );
        }
      }
    });
  },
});
