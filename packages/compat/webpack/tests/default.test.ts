import type { RsbuildPlugin } from '@rsbuild/core';
import { createStubRsbuild } from './helper';

describe('applyDefaultPlugins', () => {
  it('should apply default plugins correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        _privateMeta: {
          configFilePath: '/path/to/rsbuild.config.ts',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({});

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when target web worker', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        output: {
          target: 'web-worker',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when target node', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        output: {
          target: 'node',
        },
      },
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});

describe('bundlerApi', () => {
  it('test modifyBundlerChain and api order', async () => {
    const testPlugin: RsbuildPlugin = {
      name: 'plugin-devtool',
      setup(api) {
        api.modifyBundlerChain((chain) => {
          chain.target('node');
          chain.devtool('cheap-module-source-map');
        });

        api.modifyWebpackChain((chain) => {
          chain.devtool('hidden-source-map');
        });
      },
    };

    const rsbuild = await createStubRsbuild({
      plugins: [testPlugin],
    });

    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchInlineSnapshot(`
      {
        "devtool": "hidden-source-map",
        "plugins": [
          {
            "name": "RsbuildCorePlugin",
          },
        ],
        "target": "node",
      }
    `);
  });
});
