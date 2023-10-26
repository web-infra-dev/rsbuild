import path from 'path';
import {
  JS_REGEX,
  TS_REGEX,
  SVG_REGEX,
  getDistPath,
  getFilename,
  chainStaticAssetRule,
  getSvgoDefaultConfig,
  DefaultRsbuildPlugin,
} from '@rsbuild/shared';

export type SvgDefaultExport = 'component' | 'url';

export type PluginSvgrOptions = {
  /**
   * Configure the default export type of SVG files.
   */
  svgDefaultExport?: SvgDefaultExport;
};

export const pluginSvgr = (
  options: PluginSvgrOptions = {},
): DefaultRsbuildPlugin => ({
  name: 'plugin-svgr',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      const { svgDefaultExport = 'component' } = options;
      const assetType = 'svg';

      const distDir = getDistPath(config.output, assetType);
      const filename = getFilename(config.output, assetType, isProd);
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

      rule
        .oneOf(CHAIN_ID.ONE_OF.SVG)
        .type('javascript/auto')
        .use(CHAIN_ID.USE.SVGR)
        .loader(require.resolve('@svgr/webpack'))
        .options({
          svgo: true,
          svgoConfig: getSvgoDefaultConfig(),
        })
        .end()
        .when(svgDefaultExport === 'url', (c) =>
          c
            .use(CHAIN_ID.USE.URL)
            .loader(require.resolve('url-loader'))
            .options({
              limit: config.output.dataUriLimit.svg,
              name: outputName,
            }),
        );
    });
  },
});
