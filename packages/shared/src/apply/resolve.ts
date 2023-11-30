import { castArray, ensureAbsolutePath } from '../utils';
import { mergeChainedOptions } from '../mergeChainedOptions';
import type { ChainIdentifier } from '../chain';
import type {
  BundlerChain,
  ChainedConfig,
  NormalizedConfig,
  RsbuildPluginAPI,
} from '../types';

export function applyResolvePlugin(api: RsbuildPluginAPI) {
  api.modifyBundlerChain((chain, { CHAIN_ID }) => {
    const config = api.getNormalizedConfig();

    applyExtensions({ chain });

    applyAlias({
      chain,
      config,
      rootPath: api.context.rootPath,
    });

    applyFullySpecified({ chain, config, CHAIN_ID });
  });
}

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
  config,
  rootPath,
}: {
  chain: BundlerChain;
  config: NormalizedConfig;
  rootPath: string;
}) {
  const { alias } = config.source as {
    alias?: ChainedConfig<Record<string, string>>;
  };

  if (!alias) {
    return;
  }

  const mergedAlias = mergeChainedOptions({
    defaults: {},
    options: alias,
  });

  /**
   * Format alias value:
   * - Relative paths need to be turned into absolute paths.
   * - Absolute paths or a package name are not processed.
   */
  Object.keys(mergedAlias).forEach((name) => {
    const values = castArray(mergedAlias[name]);
    const formattedValues = values.map((value) => {
      if (typeof value === 'string' && value.startsWith('.')) {
        return ensureAbsolutePath(rootPath, value);
      }
      return value;
    });

    chain.resolve.alias.set(
      name,
      formattedValues.length === 1 ? formattedValues[0] : formattedValues,
    );
  });
}
