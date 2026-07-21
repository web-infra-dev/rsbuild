import { posix } from 'node:path';
import { INLINE_QUERY_REGEX } from '../constants';
import { camelCase, getFilename } from '../helpers';
import { CSS_MODULE_REGEX } from '../helpers/css';
import type { NormalizedEnvironmentConfig, RsbuildPlugin, Rspack, RspackChain } from '../types';

export const PLUGIN_RSPACK_BUILTIN_CSS_NAME = 'rsbuild:rspack-builtin-css';

type CssRuleType = 'css' | 'css/auto' | 'css/global' | 'css/module';

const CSS_MODULE_QUERY_REGEX = /[?&]module(?:&|=|$)/;

/**
 * Options for Rspack's built-in CSS parser that are not covered by
 * `output.cssModules`.
 * @experimental
 */
export type RspackBuiltinCssParserOptions = Omit<
  Rspack.CssAutoOrModuleParserOptions,
  'namedExports' | 'pure'
>;

/**
 * Options for Rspack's built-in CSS generator that are not covered by
 * `output.cssModules` or `output.emitCss`.
 * @experimental
 */
export type RspackBuiltinCssGeneratorOptions = Omit<
  Rspack.CssModuleGeneratorOptions,
  'exportsConvention' | 'exportsOnly' | 'localIdentName'
>;

/** @experimental */
export type RspackBuiltinCssPluginOptions = {
  /** Options for Rspack's built-in CSS parser. */
  parser?: RspackBuiltinCssParserOptions;
  /** Options for Rspack's built-in CSS generator. */
  generator?: RspackBuiltinCssGeneratorOptions;
};

const getCssModuleType = (
  modules: NormalizedEnvironmentConfig['output']['cssModules'],
): CssRuleType => (modules.mode === 'global' ? 'css/global' : 'css/module');

const getExportsConvention = (
  convention: NormalizedEnvironmentConfig['output']['cssModules']['exportLocalsConvention'],
): Rspack.CssGeneratorExportsConvention => {
  const conventions = ['as-is', 'camel-case', 'camel-case-only', 'dashes', 'dashes-only'] as const;
  const conventionMap = Object.fromEntries(
    conventions.flatMap((item) => [
      [item, item],
      [camelCase(item), item],
    ]),
  );

  return conventionMap[convention] ?? 'camel-case';
};

const LOCAL_IDENT_HASH_REGEX =
  /\[(?:([^:\]]+):)?(?:(hash|contenthash|fullhash))(?::([a-z]+\d*))?(?::(\d+))?\]/i;
const LOCAL_IDENT_HASH_REGEX_GLOBAL =
  /\[(?:([^:\]]+):)?(?:hash|contenthash|fullhash)(?::([a-z]+\d*))?(?::(\d+))?\]/gi;

const getLocalIdentOptions = (
  localIdentName: string | undefined,
): Partial<Rspack.CssModuleGeneratorOptions> => {
  if (localIdentName === undefined) {
    return {};
  }

  const match = localIdentName.match(LOCAL_IDENT_HASH_REGEX);
  if (!match) {
    return { localIdentName };
  }

  const [, hashFunction, , hashDigest, hashDigestLength] = match;

  return {
    localIdentName: localIdentName.replace(
      LOCAL_IDENT_HASH_REGEX_GLOBAL,
      (_match, _hashFunction, currentHashName) =>
        currentHashName === 'fullhash' ? '[fullhash]' : '[hash]',
    ),
    ...(hashFunction ? { localIdentHashFunction: hashFunction } : {}),
    ...(hashDigest ? { localIdentHashDigest: hashDigest } : {}),
    ...(hashDigestLength ? { localIdentHashDigestLength: Number(hashDigestLength) } : {}),
  };
};

const getResolveConfig = (rule: RspackChain.Rule<unknown>) =>
  (
    rule.resolve as RspackChain.Rule<unknown>['resolve'] & {
      toConfig: () => Record<string, unknown>;
    }
  ).toConfig();

const cloneRule = ({
  source,
  target,
  legacyUseIds,
}: {
  source: RspackChain.Rule<unknown>;
  target: RspackChain.Rule<unknown>;
  legacyUseIds: Set<string>;
}) => {
  target.merge(source.entries() ?? {});
  target.include.merge(source.include.values());
  target.exclude.merge(source.exclude.values());
  target.resolve.merge(getResolveConfig(source));

  for (const [id, use] of Object.entries(source.uses.entries() ?? {})) {
    if (!legacyUseIds.has(id)) {
      target.use(id).merge(use.entries() ?? {});
    }
  }
};

const applyCssModuleConfig = ({
  chain,
  config,
  emitCss,
  isProd,
  options,
}: {
  chain: RspackChain;
  config: NormalizedEnvironmentConfig;
  emitCss: boolean;
  isProd: boolean;
  options: RspackBuiltinCssPluginOptions;
}) => {
  const { cssModules } = config.output;
  const parserOptions: Rspack.CssAutoOrModuleParserOptions = {
    ...options.parser,
    namedExports: cssModules.namedExport,
    ...(config.output.injectStyles ? { exportType: 'style' as const } : {}),
    ...(cssModules.mode === 'pure' ? { pure: true } : {}),
  };
  const cssParserOptions: Rspack.CssParserOptions = {
    exportType: parserOptions.exportType,
    import: parserOptions.import,
    namedExports: parserOptions.namedExports,
    resolveImport: parserOptions.resolveImport,
    url: parserOptions.url,
  };
  const generatorOptions: Rspack.CssModuleGeneratorOptions = {
    ...options.generator,
    // Rspack currently generates an invalid `exports` reference when style exports
    // with default CSS Module exports are concatenated. CommonJS output prevents
    // concatenation for these modules while preserving Rsbuild's default exports.
    ...(config.output.injectStyles &&
    !cssModules.namedExport &&
    options.generator?.esModule === undefined
      ? { esModule: false }
      : {}),
    exportsOnly: !emitCss,
    exportsConvention: getExportsConvention(cssModules.exportLocalsConvention),
    ...getLocalIdentOptions(cssModules.localIdentName),
  };

  chain.module.parser.merge({
    css: cssParserOptions,
    'css/auto': parserOptions,
    'css/global': parserOptions,
    'css/module': parserOptions,
  });
  chain.module.generator.merge({
    css: {
      exportsOnly: generatorOptions.exportsOnly,
      esModule: generatorOptions.esModule,
    },
    'css/auto': generatorOptions,
    'css/global': generatorOptions,
    'css/module': generatorOptions,
  });

  if (emitCss && (!parserOptions.exportType || parserOptions.exportType === 'link')) {
    const cssPath = config.output.distPath.css;
    const cssFilename = getFilename(config, 'css', isProd);
    const cssAsyncPath =
      config.output.distPath.cssAsync ?? (cssPath ? `${cssPath}/async` : 'async');

    chain.output
      .set(
        'cssFilename',
        typeof cssFilename === 'function'
          ? (...args: Parameters<typeof cssFilename>) => posix.join(cssPath, cssFilename(...args))
          : posix.join(cssPath, cssFilename),
      )
      .set(
        'cssChunkFilename',
        typeof cssFilename === 'function'
          ? (...args: Parameters<typeof cssFilename>) =>
              posix.join(cssAsyncPath, cssFilename(...args))
          : posix.join(cssAsyncPath, cssFilename),
      );
  }

  return parserOptions;
};

/**
 * Use Rspack's built-in CSS module types instead of css-loader,
 * style-loader and CssExtractRspackPlugin.
 * @experimental
 */
export const pluginRspackBuiltinCss = (
  options: RspackBuiltinCssPluginOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_RSPACK_BUILTIN_CSS_NAME,
  enforce: 'post',
  setup(api) {
    let hasWarnedAuto = false;
    let hasWarnedExportGlobals = false;
    let hasWarnedMode = false;
    let hasWarnedUrl = false;

    api.modifyBundlerChain({
      order: 'post',
      handler(chain, { CHAIN_ID, environment, isProd, target }) {
        const { config } = environment;
        const { auto, exportGlobals, mode } = config.output.cssModules;

        if (!hasWarnedAuto && (auto instanceof RegExp || typeof auto === 'function')) {
          hasWarnedAuto = true;
          api.logger.warn(
            "RegExp and function values for `output.cssModules.auto` are not supported by `pluginRspackBuiltinCss`. Rspack's default CSS Modules matching will be used instead.",
          );
        }
        if (!hasWarnedMode && (mode === 'icss' || typeof mode === 'function')) {
          hasWarnedMode = true;
          api.logger.warn(
            "The 'icss' and function values for `output.cssModules.mode` are not supported by `pluginRspackBuiltinCss`. The value will be ignored and local mode will be used instead.",
          );
        }
        if (!hasWarnedExportGlobals && exportGlobals) {
          hasWarnedExportGlobals = true;
          api.logger.warn(
            '`output.cssModules.exportGlobals` is not supported by `pluginRspackBuiltinCss`. The value will be ignored.',
          );
        }
        if (!hasWarnedUrl) {
          hasWarnedUrl = true;
          api.logger.warn(
            'CSS `?url` imports are not supported by `pluginRspackBuiltinCss`. The `?url` query will be ignored.',
          );
        }

        const emitCss = config.output.emitCss ?? target === 'web';
        const parserOptions = applyCssModuleConfig({
          chain,
          config,
          emitCss,
          isProd,
          options,
        });
        const mainRuleType: CssRuleType = auto === false ? 'css' : 'css/auto';
        const moduleRuleType = getCssModuleType(config.output.cssModules);
        const legacyUseIds = new Set<string>([
          CHAIN_ID.USE.CSS,
          CHAIN_ID.USE.IGNORE_CSS,
          CHAIN_ID.USE.MINI_CSS_EXTRACT,
          CHAIN_ID.USE.STYLE,
        ]);

        for (const rule of chain.module.rules.values()) {
          for (const [name, branch] of Object.entries(rule.oneOfs.entries() ?? {})) {
            if (branch.uses.has(CHAIN_ID.USE.CSS_URL)) {
              rule.oneOfs.delete(name);
              continue;
            }

            if (!branch.uses.has(CHAIN_ID.USE.CSS)) {
              continue;
            }

            const isInline = String(branch.get('resourceQuery')) === String(INLINE_QUERY_REGEX);

            if (!isInline && auto !== false) {
              const queryModuleRule = rule.oneOf(`${name}-query-module`).before(name);
              cloneRule({
                source: branch,
                target: queryModuleRule,
                legacyUseIds,
              });
              queryModuleRule.resourceQuery(CSS_MODULE_QUERY_REGEX).type(moduleRuleType);

              const moduleRule = rule.oneOf(`${name}-module`).before(name);
              cloneRule({
                source: branch,
                target: moduleRule,
                legacyUseIds,
              });
              moduleRule.test(CSS_MODULE_REGEX).type(moduleRuleType);
            }

            for (const id of legacyUseIds) {
              branch.uses.delete(id);
            }

            branch.sideEffects(true).resolve.preferRelative(true);
            if (isInline) {
              branch.type('css/auto').parser({
                ...parserOptions,
                exportType: 'text',
                namedExports: true,
              });
            } else {
              branch.type(mainRuleType);
            }
          }
        }

        chain.plugins.delete(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT);
        chain.experiments({
          ...chain.get('experiments'),
          css: true,
        });
      },
    });
  },
});
