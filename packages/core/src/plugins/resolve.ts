import { createRequire } from 'node:module';
import { dirname, sep } from 'node:path';
import { reduceConfigs } from 'reduce-configs';
import type { ChainIdentifier } from '../configChain';
import { castArray } from '../helpers';
import { ensureAbsolutePath } from '../helpers/path';
import { logger } from '../logger';
import type {
  NormalizedEnvironmentConfig,
  RsbuildPlugin,
  RspackChain,
} from '../types';

const require = createRequire(import.meta.url);

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

function applyExtensions({
  chain,
  tsconfigPath,
}: {
  chain: RspackChain;
  tsconfigPath: string | undefined;
}) {
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

  if (tsconfigPath) {
    // TypeScript allows importing TS files with `.js` extension
    // See: https://github.com/microsoft/TypeScript/blob/c09e2ab4/src/compiler/moduleNameResolver.ts#L2151-L2168
    chain.resolve.extensionAlias.merge({
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    });
  }
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
  // TODO: remove `source.alias` in the next major version
  const mergedSourceAlias = config.source.alias
    ? reduceConfigs({
        initial: {},
        config: config.source.alias,
      })
    : {};

  const mergedResolveAlias = config.resolve.alias
    ? reduceConfigs({
        initial: {},
        config: config.resolve.alias,
      })
    : {};

  const mergedAlias = {
    ...mergedSourceAlias,
    ...mergedResolveAlias,
  };

  if (config.resolve.dedupe) {
    for (const pkgName of config.resolve.dedupe) {
      if (mergedAlias[pkgName]) {
        logger.debug(
          `[rsbuild:resolve] The package "${pkgName}" is already in the alias config, dedupe option for "${pkgName}" will be ignored.`,
        );
        continue;
      }

      let pkgPath: string | undefined;
      try {
        pkgPath = dirname(
          require.resolve(`${pkgName}/package.json`, {
            paths: [rootPath],
          }),
        );
      } catch (e) {}

      // some package does not export `package.json`,
      // so we try to resolve the package by its name
      if (!pkgPath) {
        try {
          pkgPath = require.resolve(pkgName, {
            paths: [rootPath],
          });

          // Ensure the package path is `node_modules/@scope/package-name`
          const trailing = ['node_modules', ...pkgName.split('/')].join(sep);
          while (
            !pkgPath.endsWith(trailing) &&
            pkgPath.includes('node_modules')
          ) {
            pkgPath = dirname(pkgPath);
          }
        } catch (e) {
          logger.debug(
            `[rsbuild:resolve] The package "${pkgName}" is not resolved in the project, dedupe option for "${pkgName}" will be ignored.`,
          );
          continue;
        }
      }

      mergedAlias[pkgName] = pkgPath;
    }
  }

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

        applyExtensions({ chain, tsconfigPath });

        applyAlias({
          chain,
          config,
          rootPath: api.context.rootPath,
        });

        // In some cases (modern.js), there is an error if the fullySpecified rule is after the js rule
        applyFullySpecified({ chain, config, CHAIN_ID });

        const aliasStrategy =
          config.source.aliasStrategy ?? config.resolve.aliasStrategy;

        if (
          tsconfigPath &&
          // Only Rspack has the tsConfig option
          api.context.bundlerType === 'rspack' &&
          aliasStrategy === 'prefer-tsconfig'
        ) {
          chain.resolve.tsConfig({
            configFile: tsconfigPath,
            // read `paths` in referenced tsconfig files
            references: 'auto',
          });
        }
      },
    });
  },
});
