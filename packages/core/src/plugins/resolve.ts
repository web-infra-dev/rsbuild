import {
  type BundlerChain,
  type ChainIdentifier,
  type NormalizedConfig,
  type RsbuildTarget,
  castArray,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { ensureAbsolutePath } from '../helpers';
import type { RsbuildPlugin } from '../types';

// compatible with legacy packages with type="module"
// https://github.com/webpack/webpack/issues/11467
function applyFullySpecified({
  chain,
  CHAIN_ID,
}: {
  chain: BundlerChain;
  config: NormalizedConfig;
  CHAIN_ID: ChainIdentifier;
}) {
  chain.module
    .rule(CHAIN_ID.RULE.MJS)
    .test(/\.m?js/)
    .resolve.set('fullySpecified', false);
}

function applyExtensions({ chain }: { chain: BundlerChain }) {
  const extensions = [
    // most projects are using TypeScript, resolve .ts(x) files first to reduce resolve time.
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.json',
  ];

  chain.resolve.extensions.merge(extensions);
}

function applyAlias({
  chain,
  target,
  config,
  rootPath,
}: {
  chain: BundlerChain;
  target: RsbuildTarget;
  config: NormalizedConfig;
  rootPath: string;
}) {
  const { alias } = config.source;

  if (!alias) {
    return;
  }

  const mergedAlias = mergeChainedOptions({
    defaults: {},
    options: alias,
    utils: { target },
  });

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  for (const name of Object.keys(mergedAlias)) {
    const values = castArray(mergedAlias[name]);
    const formattedValues = values.map((value) => {
      if (typeof value === 'string' && value.startsWith('.')) {
        return ensureAbsolutePath(rootPath, value);
      }
      return value;
    });

    chain.resolve.alias.set(
      name,
      (formattedValues.length === 1 ? formattedValues[0] : formattedValues) as
        | string
        | string[],
    );
  }
}

export const pluginResolve = (): RsbuildPlugin => ({
  name: 'rsbuild:resolve',

  setup(api) {
    api.modifyBundlerChain({
      order: 'pre',
      handler: (chain, { target, CHAIN_ID }) => {
        const config = api.getNormalizedConfig();

        applyExtensions({ chain });

        applyAlias({
          chain,
          target,
          config,
          rootPath: api.context.rootPath,
        });

        // in some cases (modern.js), get error when fullySpecified rule after js rule
        applyFullySpecified({ chain, config, CHAIN_ID });
      },
    });

    api.modifyRspackConfig(async (rspackConfig) => {
      const isTsProject = Boolean(api.context.tsconfigPath);
      const config = api.getNormalizedConfig();

      rspackConfig.resolve ||= {};

      if (isTsProject && config.source.aliasStrategy === 'prefer-tsconfig') {
        rspackConfig.resolve.tsConfigPath = api.context.tsconfigPath;
      }
    });
  },
});
