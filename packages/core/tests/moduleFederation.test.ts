import { matchPlugin } from '@scripts/test-helper';
import { createRsbuild } from '../src';

describe('plugin-module-federation', () => {
  it('should set module federation config', async () => {
    const rsbuild = await createRsbuild({
      config: {
        moduleFederation: {
          options: {
            name: 'remote',
            exposes: {
              './Button': './src/Button',
            },
            filename: 'remoteEntry.js',
            shared: {
              react: {
                singleton: true,
                requiredVersion: '^19.0.0',
              },
              'react-dom': {
                singleton: true,
                requiredVersion: '^19.0.0',
              },
            },
          },
        },
      },
    });

    const config = (await rsbuild.initConfigs())[0];
    expect(matchPlugin(config, 'ModuleFederationPlugin')).toMatchSnapshot();
  });

  it('should set environment module federation config correctly', async () => {
    const rsbuild = await createRsbuild({
      config: {
        environments: {
          web: {
            moduleFederation: {
              options: {
                name: 'remote',
                exposes: {
                  './Button': './src/Button',
                },
                filename: 'remoteEntry.js',
                shared: {
                  react: {
                    singleton: true,
                    requiredVersion: '^19.0.0',
                  },
                  'react-dom': {
                    singleton: true,
                    requiredVersion: '^19.0.0',
                  },
                },
              },
            },
          },
          web1: {},
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(
      configs.map((config) => matchPlugin(config, 'ModuleFederationPlugin')),
    ).toMatchSnapshot();
  });

  it('should set module federation and environment splitChunks config correctly', async () => {
    const rsbuild = await createRsbuild({
      config: {
        moduleFederation: {
          options: {
            name: 'remote',
            exposes: {
              './Button': './src/Button',
            },
            filename: 'remoteEntry.js',
            shared: {
              react: {
                singleton: true,
                requiredVersion: '^19.0.0',
              },
              'react-dom': {
                singleton: true,
                requiredVersion: '^19.0.0',
              },
            },
          },
        },
        environments: {
          web: {},
          web1: {
            splitChunks: false,
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(
      configs.map((config) => matchPlugin(config, 'ModuleFederationPlugin')),
    ).toMatchSnapshot();
  });
});
