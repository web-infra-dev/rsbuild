import {
  pick,
  JS_REGEX,
  CSS_REGEX,
  RUNTIME_CHUNK_NAME,
  isHtmlDisabled,
  DefaultRsbuildPlugin,
  type InlineChunkTest,
} from '@rsbuild/shared';

export const pluginInlineChunk = (): DefaultRsbuildPlugin => ({
  name: 'plugin-inline-chunk',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { target, CHAIN_ID, isProd, HtmlPlugin }) => {
        const config = api.getNormalizedConfig();

        if (isHtmlDisabled(config, target) || !isProd) {
          return;
        }

        const { InlineChunkHtmlPlugin } = await import('@rsbuild/shared');

        const {
          disableInlineRuntimeChunk,
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

        if (!disableInlineRuntimeChunk) {
          scriptTests.push(
            // RegExp like /bundler-runtime([.].+)?\.js$/
            // matches bundler-runtime.js and bundler-runtime.123456.js
            new RegExp(`${RUNTIME_CHUNK_NAME}([.].+)?\\.js$`),
          );
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
