import { applyToCompiler, createVirtualModule } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginNonce = (): RsbuildPlugin => ({
  name: 'rsbuild:nonce',

  setup(api) {
    api.onAfterCreateCompiler(({ compiler }) => {
      const { nonce } = api.getNormalizedConfig().security;

      if (!nonce) {
        return;
      }

      applyToCompiler(compiler, (compiler) => {
        const { plugins } = compiler.options;
        const hasHTML = plugins.some(
          (plugin) => plugin && plugin.constructor.name === 'HtmlBasicPlugin',
        );
        if (!hasHTML) {
          return;
        }

        // apply __webpack_nonce__
        // https://webpack.js.org/guides/csp/
        const injectCode = createVirtualModule(
          `__webpack_nonce__ = "${nonce}";`,
        );
        new compiler.webpack.EntryPlugin(compiler.context, injectCode, {
          name: undefined,
        }).apply(compiler);
      });
    });

    api.modifyHTMLTags({
      // ensure `nonce` can be applied to all tags
      order: 'post',
      handler: ({ headTags, bodyTags }) => {
        const config = api.getNormalizedConfig();
        const { nonce } = config.security;
        const allTags = [...headTags, ...bodyTags];

        if (nonce) {
          for (const tag of allTags) {
            if (tag.tag === 'script' || tag.tag === 'style') {
              tag.attrs ??= {};
              tag.attrs.nonce = nonce;
            }
          }
        }

        return { headTags, bodyTags };
      },
    });
  },
});
