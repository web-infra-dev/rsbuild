import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import { PLUGIN_REACT_NAME } from '@rsbuild/plugin-react';
import type { Config as SvgrOptions } from '@svgr/core';
import deepmerge from 'deepmerge';
import type { Config as SvgoConfig } from 'svgo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type SvgoPluginConfig = NonNullable<SvgoConfig['plugins']>[0];

export type SvgDefaultExport = 'component' | 'url';

const SVG_REGEX = /\.svg$/;

export type PluginSvgrOptions = {
  /**
   * Configure SVGR options.
   * @see https://react-svgr.com/docs/options/
   */
  svgrOptions?: SvgrOptions;

  /**
   * Whether to allow the use of default import and named import at the same time.
   * @default false
   */
  mixedImport?: boolean;

  /**
   * Custom query suffix to match SVGR transformation.
   * @default /react/
   */
  query?: RegExp;

  /**
   * Exclude some SVG files, they will not be transformed by SVGR.
   */
  exclude?: Rspack.RuleSetCondition;

  /**
   * Exclude some modules, the SVGs imported by these modules will not be transformed by SVGR.
   */
  excludeImporter?: Rspack.RuleSetCondition;
};

const getSvgoDefaultConfig = (): SvgoConfig => ({
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // viewBox is required to resize SVGs with CSS.
          // @see https://github.com/svg/svgo/issues/1128
          removeViewBox: false,
        },
      },
    },
    'prefixIds',
  ],
});

/**
 * Dedupe SVGO plugins config.
 *
 * @example
 * Input:
 *   {
 *     plugins: [
 *       { name: 'preset-default', params: { foo: true }],
 *       { name: 'preset-default', params: { bar: true }],
 *     ]
 *   }
 * Output:
 *   {
 *     plugins: [
 *       { name: 'preset-default', params: { foo: true, bar: true }],
 *     ]
 *   }
 */
const dedupeSvgoPlugins = (config: SvgoConfig): SvgoConfig => {
  if (!config.plugins) {
    return config;
  }

  let mergedPlugins: SvgoPluginConfig[] = [];

  for (const plugin of config.plugins) {
    if (typeof plugin === 'string') {
      const exist = mergedPlugins.find(
        (item) =>
          item === plugin || (typeof item === 'object' && item.name === plugin),
      );

      if (!exist) {
        mergedPlugins.push(plugin);
      }

      continue;
    }

    const strIndex = mergedPlugins.findIndex(
      (item) => typeof item === 'string' && item === plugin.name,
    );
    if (strIndex !== -1) {
      mergedPlugins[strIndex] = plugin;
      continue;
    }

    let isMerged = false;

    mergedPlugins = mergedPlugins.map((item) => {
      if (typeof item === 'object' && item.name === plugin.name) {
        isMerged = true;
        return deepmerge<SvgoPluginConfig>(item, plugin);
      }
      return item;
    });

    if (!isMerged) {
      mergedPlugins.push(plugin);
    }
  }

  config.plugins = mergedPlugins;

  return config;
};

export const PLUGIN_SVGR_NAME = 'rsbuild:svgr';

export const pluginSvgr = (options: PluginSvgrOptions = {}): RsbuildPlugin => ({
  name: PLUGIN_SVGR_NAME,

  pre: [PLUGIN_REACT_NAME],

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const { config } = environment;
      const { dataUriLimit } = config.output;
      const maxSize =
        typeof dataUriLimit === 'number' ? dataUriLimit : dataUriLimit.svg;

      let generatorOptions: Rspack.GeneratorOptionsByModuleType['asset/resource'] =
        {};

      if (chain.module.rules.has(CHAIN_ID.RULE.SVG)) {
        generatorOptions = chain.module.rules
          .get(CHAIN_ID.RULE.SVG)
          .oneOfs.get(CHAIN_ID.ONE_OF.SVG_URL)
          .get('generator');

        // delete Rsbuild builtin SVG rules
        chain.module.rules.delete(CHAIN_ID.RULE.SVG);
      }

      const rule = chain.module.rule(CHAIN_ID.RULE.SVG).test(SVG_REGEX);

      const svgrOptions = deepmerge<SvgrOptions>(
        {
          svgo: true,
          svgoConfig: getSvgoDefaultConfig(),
        },
        options.svgrOptions || {},
      );

      svgrOptions.svgoConfig = dedupeSvgoPlugins(svgrOptions.svgoConfig);

      // force to url: "foo.svg?url",
      rule
        .oneOf(CHAIN_ID.ONE_OF.SVG_URL)
        .type('asset/resource')
        .resourceQuery(/(__inline=false|url)/)
        .set('generator', generatorOptions);

      // force to inline: "foo.svg?inline"
      rule
        .oneOf(CHAIN_ID.ONE_OF.SVG_INLINE)
        .type('asset/inline')
        .resourceQuery(/inline/);

      // force to react component: "foo.svg?react"
      rule
        .oneOf(CHAIN_ID.ONE_OF.SVG_REACT)
        .type('javascript/auto')
        .resourceQuery(options.query || /react/)
        .use(CHAIN_ID.USE.SVGR)
        .loader(path.resolve(__dirname, './loader.mjs'))
        .options({
          ...svgrOptions,
          exportType: 'default',
        } satisfies SvgrOptions)
        .end();

      // SVG in JS files
      const { mixedImport = false } = options;
      if (mixedImport || svgrOptions.exportType) {
        const { exportType = mixedImport ? 'named' : undefined } = svgrOptions;

        const issuerInclude = [
          /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/,
          /\.mdx$/,
        ];
        const issuer = options.excludeImporter
          ? { and: [issuerInclude, { not: options.excludeImporter }] }
          : issuerInclude;

        const svgRule = rule.oneOf(CHAIN_ID.ONE_OF.SVG);

        if (options.exclude) {
          svgRule.exclude.add(options.exclude);
        }

        svgRule
          .type('javascript/auto')
          // The issuer option ensures that SVGR will only apply if the SVG is imported from a JS file.
          .set('issuer', issuer)
          .use(CHAIN_ID.USE.SVGR)
          .loader(path.resolve(__dirname, './loader.mjs'))
          .options({
            ...svgrOptions,
            exportType,
          })
          .end();

        /**
         * For mixed import.
         * @example import logoUrl, { ReactComponent } from './logo.svg';`
         */
        if (mixedImport && exportType === 'named') {
          svgRule
            .use(CHAIN_ID.USE.URL)
            .loader(path.join(__dirname, '../compiled', 'url-loader/index.js'))
            .options({
              limit: maxSize,
              name: generatorOptions?.filename,
            });
        }
      }

      // SVG as assets
      rule
        .oneOf(CHAIN_ID.ONE_OF.SVG_ASSET)
        .type('asset')
        .parser({
          // Inline SVG if size < maxSize
          dataUrlCondition: {
            maxSize,
          },
        })
        .set('generator', generatorOptions);

      // apply current JS transform rule to SVGR rules
      const jsRule = chain.module.rules.get(CHAIN_ID.RULE.JS);

      [CHAIN_ID.USE.SWC, CHAIN_ID.USE.BABEL].some((jsUseId) => {
        const use = jsRule.uses.get(jsUseId);

        if (!use) {
          return false;
        }

        for (const oneOfId of [
          CHAIN_ID.ONE_OF.SVG,
          CHAIN_ID.ONE_OF.SVG_REACT,
        ]) {
          if (!rule.oneOfs.has(oneOfId)) {
            continue;
          }

          rule
            .oneOf(oneOfId)
            .use(jsUseId)
            .before(CHAIN_ID.USE.SVGR)
            .loader(use.get('loader'))
            .options(use.get('options'));
        }

        return true;
      });
    });
  },
});
