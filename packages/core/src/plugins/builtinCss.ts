import { CSS_REGEX, RAW_QUERY_REGEX } from '../constants';
import { getFilename } from '../helpers';
import type { RsbuildPlugin } from '../types';
import {
  createPostCSSTransform,
  getCSSOutputFilename,
  getLightningCSSLoaderOptions,
} from './cssShared';

export const pluginBuiltinCss = (): RsbuildPlugin => ({
  name: 'rsbuild:builtin-css',
  setup(api) {
    const applyPostCSS = createPostCSSTransform(api.context.rootPath);

    api.modifyBundlerChain({
      order: 'pre',
      handler: async (chain, utils) => {
        const { environment, CHAIN_ID, isProd } = utils;
        const { config, browserslist } = environment;
        if (!config.css) return;

        const cssRule = chain.module.rule(CHAIN_ID.RULE.CSS);
        cssRule.test(CSS_REGEX).dependency({ not: 'url' });
        cssRule
          .oneOf(CHAIN_ID.ONE_OF.CSS_TEXT)
          .with({ type: 'text' })
          .type('asset/source');
        cssRule
          .oneOf(CHAIN_ID.ONE_OF.CSS_RAW)
          .resourceQuery(RAW_QUERY_REGEX)
          .type('asset/source');

        const mainRule = cssRule.oneOf(CHAIN_ID.ONE_OF.CSS_MAIN);
        mainRule
          .type('css/auto')
          .sideEffects(true)
          .resolve.preferRelative(true);
        if (config.tools.lightningcssLoader !== false) {
          mainRule
            .use(CHAIN_ID.USE.LIGHTNINGCSS)
            .loader('builtin:lightningcss-loader')
            .options(
              await getLightningCSSLoaderOptions(config, browserslist, false),
            );
        }
        await applyPostCSS(utils, mainRule);

        chain.output.set(
          'cssFilename',
          getCSSOutputFilename(
            config.output.distPath.css,
            getFilename(config, 'css', isProd),
          ),
        );
      },
    });
  },
});
