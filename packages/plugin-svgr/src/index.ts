import path from 'path';
import {
  JS_REGEX,
  TS_REGEX,
  SVG_REGEX,
  deepmerge,
  getDistPath,
  getFilename,
  chainStaticAssetRule,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';
import { Config } from '@svgr/core';

export type SvgDefaultExport = 'component' | 'url';

export type PluginSvgrOptions = {
  /**
   * Configure SVGR options.
   */
  svgrOptions?: Config;

  /**
   * Configure the default export type of SVG files.
   * @default 'url'
   */
  svgDefaultExport?: SvgDefaultExport;
};

function getSvgoDefaultConfig() {
  return {
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
  };
}

export const pluginSvgr = (options: PluginSvgrOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:svgr',

  pre: ['rsbuild:babel', 'uni-builder:babel', 'rsbuild-webpack:swc'],

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      const { svgDefaultExport = 'url' } = options;
      const assetType = 'svg';

      const distDir = getDistPath(config, assetType);
      const filename = getFilename(config, assetType, isProd);
      const outputName = path.posix.join(distDir, filename);
      const maxSize = config.output.dataUriLimit[assetType];

      // delete origin rules
      chain.module.rules.delete(CHAIN_ID.RULE.SVG);

      const rule = chain.module.rule(CHAIN_ID.RULE.SVG).test(SVG_REGEX);

      // If we import SVG from a CSS file, it will be processed as assets.
      chainStaticAssetRule({
        rule,
        maxSize,
        filename: path.posix.join(distDir, filename),
        assetType,
        issuer: {
          // The issuer option ensures that SVGR will only apply if the SVG is imported from a JS file.
          not: [JS_REGEX, TS_REGEX],
        },
      });

      rule
        .oneOf(CHAIN_ID.ONE_OF.SVG_INLINE)
        .type('asset/inline')
        .resourceQuery(/inline/);

      rule
        .oneOf(CHAIN_ID.ONE_OF.SVG_URL)
        .type('asset/resource')
        .resourceQuery(/url/)
        .set('generator', {
          filename: outputName,
        });

      const jsRule = chain.module.rules.get(CHAIN_ID.RULE.JS);
      const svgrRule = rule.oneOf(CHAIN_ID.ONE_OF.SVG).type('javascript/auto');

      [CHAIN_ID.USE.SWC, CHAIN_ID.USE.BABEL].some((id) => {
        const use = jsRule.uses.get(id);

        if (use) {
          svgrRule
            .use(id)
            .loader(use.get('loader'))
            .options(use.get('options'));
          return true;
        }

        return false;
      });

      const svgrOptions = deepmerge(
        {
          svgo: true,
          svgoConfig: getSvgoDefaultConfig(),
        },
        options.svgrOptions || {},
      );

      svgrRule
        .use(CHAIN_ID.USE.SVGR)
        .loader(path.resolve(__dirname, './loader'))
        .options(svgrOptions)
        .end()
        .when(svgDefaultExport === 'url', (c) =>
          c
            .use(CHAIN_ID.USE.URL)
            .loader(path.join(__dirname, '../compiled', 'url-loader'))
            .options({
              limit: config.output.dataUriLimit.svg,
              name: outputName,
            }),
        );
    });
  },
});
