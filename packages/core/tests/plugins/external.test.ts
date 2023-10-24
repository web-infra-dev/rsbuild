import * as shared from '@rsbuild/shared';
import { pluginExternals } from '@src/plugins/externals';

describe('plugin-external', () => {
  it('should add external config', async () => {
    let modifyBundlerChainCb: any;
    let onBeforeCreateCompilerCb: any;

    const api: any = {
      modifyBundlerChain: (fn: any) => {
        modifyBundlerChainCb = fn;
      },
      getNormalizedConfig: () => ({
        output: {
          externals: ['react', /@swc\/.*/],
        },
      }),
      onBeforeCreateCompiler: (fn: any) => {
        onBeforeCreateCompilerCb = fn;
      },
    };

    pluginExternals().setup(api);

    const chain = await shared.getBundlerChain();

    await modifyBundlerChainCb(chain);

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
