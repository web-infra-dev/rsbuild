import { CSS_REGEX, JS_REGEX } from '../constants';
import { pick } from '../helpers';
import type { InlineChunkTest, RsbuildPlugin } from '../types';

export const pluginInlineChunk = (): RsbuildPlugin => ({
  name: 'rsbuild:inline-chunk',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isDev, environment }) => {
      const { htmlPaths, config } = environment;
      if (Object.keys(htmlPaths).length === 0 || isDev) {
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
        .before(CHAIN_ID.PLUGIN.HTML_BASIC)
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
