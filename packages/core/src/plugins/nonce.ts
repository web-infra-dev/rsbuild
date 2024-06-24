import { applyToCompiler, createVirtualModule } from '../helpers';
import type { RsbuildPlugin } from '../types';

export const pluginNonce = (): RsbuildPlugin => ({
  name: 'rsbuild:nonce',

  setup(api) {
    api.onAfterCreateCompiler(({ compiler }) => {
      const nonces = Object.keys(api.context.environments).map(
        (environment) => {
          const { nonce } = api.getNormalizedConfig({ environment }).security;

          return nonce;
        },
      );

      if (!nonces.some((nonce) => !!nonce)) {
        return;
      }

      applyToCompiler(compiler, (compiler, index) => {
        const nonce = nonces[index];
        const { plugins } = compiler.options;
        const hasHTML = plugins.some(
          (plugin) => plugin && plugin.constructor.name === 'HtmlBasicPlugin',
        );
        if (!hasHTML || !nonce) {
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
      handler: ({ headTags, bodyTags }, { environment }) => {
        const config = api.getNormalizedConfig({ environment });
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
