import { getExtensions } from '../config';
import _ from 'lodash';
import { castArray, ensureAbsolutePath } from '../utils';
import type { ChainIdentifier } from '../chain';
import { mergeChainedOptions } from '../mergeChainedOptions';
import {
  RsbuildTarget,
  BundlerChain,
  ChainedConfig,
  SharedRsbuildPluginAPI,
  NormalizedConfig,
} from '../types';

export function applyResolvePlugin(api: SharedRsbuildPluginAPI) {
  api.modifyBundlerChain((chain, { target, CHAIN_ID }) => {
    const config = api.getNormalizedConfig();
    const isTsProject = Boolean(api.context.tsconfigPath);
    applyExtensions({
      chain,
      config,
      target,
      isTsProject,
    });

    applyAlias({
      chain,
      config,
      rootPath: api.context.rootPath,
    });

    applyMainFields({
      chain,
      config,
      target,
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

function applyExtensions({
  chain,
  config,
  target,
  isTsProject,
}: {
  chain: BundlerChain;
  config: NormalizedConfig;
  target: RsbuildTarget;
  isTsProject: boolean;
}) {
  const extensions = getExtensions({
    target,
    isTsProject,
    resolveExtensionPrefix: config.source.resolveExtensionPrefix,
  });

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

function applyMainFields({
  chain,
  config,
  target,
}: {
  chain: BundlerChain;
  config: NormalizedConfig;
  target: RsbuildTarget;
}) {
  const { resolveMainFields } = config.source;
  if (!resolveMainFields) {
    return;
  }

  const mainFields = Array.isArray(resolveMainFields)
    ? resolveMainFields
    : resolveMainFields[target];

  if (mainFields) {
    mainFields
      .reduce((result: string[], fields) => {
        if (Array.isArray(fields)) {
          result.push(...fields);
        } else {
          result.push(fields);
        }
        return result;
      }, [] as string[])
      .forEach((field) => {
        chain.resolve.mainFields.add(field);
      });
  }
}
