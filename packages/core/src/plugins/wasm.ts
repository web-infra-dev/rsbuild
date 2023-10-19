import { join } from 'path';
import { getDistPath, type DefaultRsbuildPlugin } from '@rsbuild/shared';

export const pluginWasm = (): DefaultRsbuildPlugin => ({
  name: 'plugin-wasm',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const distPath = getDistPath(config.output, 'wasm');

      chain.experiments({
        ...chain.get('experiments'),
        asyncWebAssembly: true,
      });

      const wasmFilename = join(distPath, '[hash].module.wasm');

      chain.output.merge({
        webassemblyModuleFilename: wasmFilename,
      });

      // support new URL('./xx.wasm', import.meta.url)
      chain.module
        .rule(CHAIN_ID.RULE.WASM)
        .test(/\.wasm$/)
        // only include assets that came from new URL calls
        .merge({
          dependency: 'url',
        })
        .type('asset/resource')
        .set('generator', {
          filename: wasmFilename,
        });
    });
  },
});
