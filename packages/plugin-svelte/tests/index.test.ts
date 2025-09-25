import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginSvelte } from '../src';

describe('plugin-svelte', () => {
  it('should add svelte loader and resolve config properly', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [pluginSvelte()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.svelte')).toMatchSnapshot();
    expect(bundlerConfigs[0].resolve).toMatchSnapshot();
  });

  it('should add rule for `.svelte.js` and `.svelte.ts` as expected', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [pluginSvelte()],
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.svelte.js')).toMatchSnapshot();
    expect(matchRules(bundlerConfigs[0], 'a.svelte.ts')).toMatchSnapshot();
  });

  it('should set dev and hotReload to false in production mode', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [pluginSvelte()],
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.svelte')).toMatchSnapshot();
    process.env.NODE_ENV = NODE_ENV;
  });

  it('should turn off HMR by hand correctly', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        dev: {
          hmr: false,
        },
        plugins: [pluginSvelte()],
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.svelte')).toMatchSnapshot();
  });

  it('should override default svelte-loader options throw options.svelteLoaderOptions', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [
          pluginSvelte({
            svelteLoaderOptions: {
              preprocess: null,
            },
          }),
        ],
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.svelte')).toMatchSnapshot();
  });

  it('should support pass custom preprocess options', async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
        plugins: [
          pluginSvelte({
            preprocessOptions: {
              aliases: [
                ['potato', 'potatoLanguage'],
                ['pot', 'potatoLanguage'],
              ],
              /** Add a custom language preprocessor */
              potatoLanguage: ({ content }: { content: string }) => {
                const { code, map } =
                  require('potato-language').render(content);
                return { code, map };
              },
            },
          }),
        ],
      },
    });
    const bundlerConfigs = await rsbuild.initConfigs();
    expect(matchRules(bundlerConfigs[0], 'a.svelte')).toMatchSnapshot();
  });
});
