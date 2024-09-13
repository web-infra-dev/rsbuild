import { reduceConfigs } from 'reduce-configs';
import type { ChainIdentifier } from '../configChain';
import { castArray } from '../helpers';
import { ensureAbsolutePath } from '../helpers/path';
import type {
  NormalizedEnvironmentConfig,
  RsbuildPlugin,
  RspackChain,
} from '../types';

// compatible with legacy packages with type="module"
// https://github.com/webpack/webpack/issues/11467
function applyFullySpecified({
  chain,
  CHAIN_ID,
}: {
  chain: RspackChain;
  config: NormalizedEnvironmentConfig;
  CHAIN_ID: ChainIdentifier;
}) {
  chain.module
    .rule(CHAIN_ID.RULE.MJS)
    .test(/\.m?js/)
    .resolve.set('fullySpecified', false);
}

function applyExtensions({ chain }: { chain: RspackChain }) {
  const extensions = [
    // most projects are using TypeScript, resolve .ts(x) files first to reduce resolve time.
    '.ts',
    '.tsx',
    '.mjs',
    '.js',
    '.jsx',
    '.json',
  ];

  chain.resolve.extensions.merge(extensions);
}

function applyAlias({
  chain,
  config,
  rootPath,
}: {
  chain: RspackChain;
  config: NormalizedEnvironmentConfig;
  rootPath: string;
}) {
  const { alias } = config.source;

  if (!alias) {
    return;
  }

  const mergedAlias = reduceConfigs({
    initial: {},
    config: alias,
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
      handler: (chain, { environment, CHAIN_ID }) => {
        const { config, tsconfigPath } = environment;

        applyExtensions({ chain });

        applyAlias({
          chain,
          config,
          rootPath: api.context.rootPath,
        });

        // In some cases (modern.js), there is an error if the fullySpecified rule is after the js rule
        applyFullySpecified({ chain, config, CHAIN_ID });

        if (
          tsconfigPath &&
          // Only Rspack has the tsConfig option
          api.context.bundlerType === 'rspack' &&
          config.source.aliasStrategy === 'prefer-tsconfig'
        ) {
          chain.resolve.tsConfig({
            configFile: tsconfigPath,
          });
        }
      },
    });
  },
});
