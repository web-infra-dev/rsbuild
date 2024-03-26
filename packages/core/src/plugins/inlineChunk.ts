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
    api.modifyBundlerChain(async (chain, { target, CHAIN_ID, isDev }) => {
      const config = api.getNormalizedConfig();

      if (isHtmlDisabled(config, target) || isDev) {
        return;
      }

      const { InlineChunkHtmlPlugin } = await import(
        '../rspack/InlineChunkHtmlPlugin'
      );

      const { inlineStyles, inlineScripts } = config.output;

      const scriptTests: InlineChunkTest[] = [];
      const styleTests: InlineChunkTest[] = [];

      if (inlineScripts) {
        scriptTests.push(inlineScripts === true ? JS_REGEX : inlineScripts);
      }

      if (inlineStyles) {
        styleTests.push(inlineStyles === true ? CSS_REGEX : inlineStyles);
      }

      if (!scriptTests.length && !styleTests.length) {
        return;
      }

      chain
        .plugin(CHAIN_ID.PLUGIN.INLINE_HTML)
        // ensure nonce can be applied to inlined style tags
        .before(CHAIN_ID.PLUGIN.HTML_NONCE)
        .use(InlineChunkHtmlPlugin, [
          {
            styleTests,
            scriptTests,
            distPath: pick(config.output.distPath, ['js', 'css']),
          },
        ]);
    });
  },
});
