import { posix } from 'node:path';
import { INLINE_QUERY_REGEX } from '../constants';
import { camelCase, getFilename } from '../helpers';
import { CSS_MODULE_REGEX } from '../helpers/css';
import type { NormalizedEnvironmentConfig, RsbuildPlugin, Rspack, RspackChain } from '../types';

export const PLUGIN_RSPACK_BUILTIN_CSS_NAME = 'rsbuild:rspack-builtin-css';

type CssRuleType = 'css' | 'css/auto' | 'css/global' | 'css/module';

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
}: {
  chain: RspackChain;
  config: NormalizedEnvironmentConfig;
  emitCss: boolean;
  isProd: boolean;
}) => {
  const { cssModules } = config.output;
  const exportType = config.output.injectStyles ? ('style' as const) : undefined;
  const parserOptions: Rspack.CssAutoOrModuleParserOptions = {
    namedExports: cssModules.namedExport,
    ...(exportType ? { exportType } : {}),
    ...(cssModules.mode === 'pure' ? { pure: true } : {}),
  };
  const cssParserOptions: Rspack.CssParserOptions = {
    namedExports: parserOptions.namedExports,
    ...(exportType ? { exportType } : {}),
  };
  const generatorOptions: Rspack.CssModuleGeneratorOptions = {
    exportsOnly: !emitCss,
    exportsConvention: getExportsConvention(cssModules.exportLocalsConvention),
    ...(cssModules.localIdentName === undefined
      ? {}
      : { localIdentName: cssModules.localIdentName }),
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
    },
    'css/auto': generatorOptions,
    'css/global': generatorOptions,
    'css/module': generatorOptions,
  });

  if (emitCss && !exportType) {
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
export const pluginRspackBuiltinCss = (): RsbuildPlugin => ({
  name: PLUGIN_RSPACK_BUILTIN_CSS_NAME,
  enforce: 'post',
  setup(api) {
    let hasWarnedAuto = false;
    let hasWarnedExportGlobals = false;
    let hasWarnedMode = false;
    let hasWarnedUrl = false;
    let hasWarnedVue = false;

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
        if (
          !hasWarnedVue &&
          auto !== false &&
          api.isPluginExists('rsbuild:vue', { environment: environment.name })
        ) {
          hasWarnedVue = true;
          api.logger.warn(
            'Vue SFC CSS Modules (`<style module>`) are not supported by `pluginRspackBuiltinCss`.',
          );
        }

        const emitCss = config.output.emitCss ?? target === 'web';
        const parserOptions = applyCssModuleConfig({
          chain,
          config,
          emitCss,
          isProd,
        });
        const mainRuleType: CssRuleType = auto === false ? 'css' : 'css/auto';
        const moduleRuleType = getCssModuleType(config.output.cssModules);
        const legacyUseIds = new Set<string>([
          CHAIN_ID.USE.CSS,
          CHAIN_ID.USE.IGNORE_CSS,
          CHAIN_ID.USE.MINI_CSS_EXTRACT,
          CHAIN_ID.USE.STYLE,
        ]);
        let removedUrlRule = false;

        for (const rule of chain.module.rules.values()) {
          for (const [name, branch] of Object.entries(rule.oneOfs.entries() ?? {})) {
            if (branch.uses.has(CHAIN_ID.USE.CSS_URL)) {
              rule.oneOfs.delete(name);
              removedUrlRule = true;
              continue;
            }

            if (!branch.uses.has(CHAIN_ID.USE.CSS)) {
              continue;
            }

            const isInline = String(branch.get('resourceQuery')) === String(INLINE_QUERY_REGEX);

            if (!isInline && auto !== false) {
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

        if (removedUrlRule && !hasWarnedUrl) {
          hasWarnedUrl = true;
          api.logger.warn(
            'CSS `?url` imports are not supported by `pluginRspackBuiltinCss`. The `?url` query will be ignored.',
          );
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
