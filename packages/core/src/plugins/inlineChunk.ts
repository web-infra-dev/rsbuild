import {
  pick,
  JS_REGEX,
  CSS_REGEX,
  isHtmlDisabled,
  type InlineChunkTest,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginInlineChunk = (): RsbuildPlugin => ({
  name: 'rsbuild:inline-chunk',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { target, CHAIN_ID, isProd, HtmlPlugin }) => {
        const config = api.getNormalizedConfig();

        if (isHtmlDisabled(config, target) || !isProd) {
          return;
        }

        const { InlineChunkHtmlPlugin } = await import('@rsbuild/shared');

        const {
          enableInlineStyles,
          // todo: not support enableInlineScripts in Rspack yet, which will take unknown build error
          enableInlineScripts,
        } = config.output;

        const scriptTests: InlineChunkTest[] = [];
        const styleTests: InlineChunkTest[] = [];

        if (enableInlineScripts) {
          scriptTests.push(
            enableInlineScripts === true ? JS_REGEX : enableInlineScripts,
          );
        }

        if (enableInlineStyles) {
          styleTests.push(
            enableInlineStyles === true ? CSS_REGEX : enableInlineStyles,
          );
        }

        if (!scriptTests.length && !styleTests.length) {
          return;
        }

        chain.plugin(CHAIN_ID.PLUGIN.INLINE_HTML).use(InlineChunkHtmlPlugin, [
          HtmlPlugin,
          {
            styleTests,
            scriptTests,
            distPath: pick(config.output.distPath, ['js', 'css']),
          },
        ]);
      },
    );
  },
});
