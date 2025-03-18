import RspackChain from '../compiled/rspack-chain/index.js';
import { pluginExternals } from '../src/plugins/externals';

describe('plugin-external', () => {
  it('should add external config', async () => {
    let modifyBundlerChainCb: any;
    let onBeforeCreateCompilerCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      onBeforeCreateCompiler: (fn: any) => {
        onBeforeCreateCompilerCb = fn;
      },
    };

    pluginExternals().setup(api);

    const chain = new RspackChain();

    await modifyBundlerChainCb(chain, {
      environment: {
        config: {
          output: {
            externals: ['react', /@swc\/.*/],
          },
        },
      },
    });

    const bundlerConfigs = [
      {
        ...chain.toConfig(),
        target: 'web',
      },
      {
        ...chain.toConfig(),
        target: 'webworker',
      },
    ];

    onBeforeCreateCompilerCb({ bundlerConfigs });

    expect(bundlerConfigs[0].externals).toEqual(['react', /@swc\/.*/]);
    expect(bundlerConfigs[1].externals).toBeUndefined();
  });
});
