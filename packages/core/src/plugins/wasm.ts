import { posix } from 'node:path';
import type { RsbuildPlugin } from '../types';

export const pluginWasm = (): RsbuildPlugin => ({
  name: 'rsbuild:wasm',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const { config } = environment;
      const distPath = config.output.distPath.wasm;

      chain.experiments({
        ...chain.get('experiments'),
        asyncWebAssembly: true,
      });

      const wasmFilename = posix.join(distPath, '[hash].module.wasm');
      chain.output.webassemblyModuleFilename(wasmFilename);

      // support new URL('./abc.wasm', import.meta.url)
      chain.module
        .rule(CHAIN_ID.RULE.WASM)
        .test(/\.wasm$/)
        // only include assets that came from new URL calls
        .dependency('url')
        .type('asset/resource')
        .set('generator', {
          filename: wasmFilename,
        });
    });
  },
});
