import path from 'node:path';
import { getFilename } from '../helpers';
import type { RsbuildPlugin } from '../types';

export const pluginWasm = (): RsbuildPlugin => ({
  name: 'rsbuild:wasm',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID, environment, isProd }) => {
      const { config } = environment;
      const distPath = config.output.distPath.wasm;
      const filename = path.posix.join(
        distPath,
        // webpack does not support contenthash for Wasm files
        api.context.bundlerType === 'webpack'
          ? '[hash].module.wasm'
          : getFilename(config, 'wasm', isProd),
      );

      chain.experiments({
        ...chain.get('experiments'),
        asyncWebAssembly: true,
      });

      chain.output.webassemblyModuleFilename(filename);

      // support new URL('./abc.wasm', import.meta.url)
      chain.module
        .rule(CHAIN_ID.RULE.WASM)
        .test(/\.wasm$/)
        // only include assets that came from new URL calls
        .dependency('url')
        .type('asset/resource')
        .set('generator', {
          filename,
        });
    });
  },
});
