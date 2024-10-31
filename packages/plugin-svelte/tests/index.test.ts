import { createStubRsbuild } from '@scripts/test-helper';
import { pluginSvelte } from '../src';

describe('plugin-svelte', () => {
  it('should add svelte loader properly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginSvelte()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set dev and hotReload to false in production mode', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [pluginSvelte()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should turn off HMR by hand correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        dev: {
          hmr: false,
        },
      },
      plugins: [pluginSvelte()],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should override default svelte-loader options throw options.svelteLoaderOptions', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [
        pluginSvelte({
          svelteLoaderOptions: {
            preprocess: null,
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should support pass custom preprocess options', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
      plugins: [
        pluginSvelte({
          preprocessOptions: {
            aliases: [
              ['potato', 'potatoLanguage'],
              ['pot', 'potatoLanguage'],
            ],
            /** Add a custom language preprocessor */
            potatoLanguage: ({ content }: { content: string }) => {
              const { code, map } = require('potato-language').render(content);
              return { code, map };
            },
          },
        }),
      ],
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });
});
