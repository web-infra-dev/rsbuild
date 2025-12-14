import { createStubRsbuild } from './helper';

describe('environment config', () => {
  it('tools.webpack / bundlerChain can be used in environment config', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [],
      config: {
        tools: {
          webpack(config) {
            return {
              ...config,
              devtool: 'eval',
            };
          },
        },
        environments: {
          web: {
            tools: {
              webpack(config) {
                return {
                  ...config,
                  devtool: 'eval-source-map',
                };
              },
              webpackChain: (chain) => {
                chain.output.filename('[name].web.js');
              },
            },
          },
          node: {
            output: {
              target: 'node',
            },
            tools: {
              bundlerChain: (chain) => {
                chain.output.filename('bundle.js');
              },
            },
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(configs).toMatchSnapshot();
  });
});
