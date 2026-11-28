import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { pluginLess } from '../src';

describe('plugin-less', () => {
  it('should add less-loader', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginLess()],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should add less-loader and css-loader when injectStyles', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginLess()],
        output: {
          injectStyles: true,
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should add less-loader with tools.less', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginLess({
            lessLoaderOptions: {
              lessOptions: {
                javascriptEnabled: false,
              },
            },
          }),
        ],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should add less-loader with excludes', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginLess({
            lessLoaderOptions(_config, { addExcludes }) {
              addExcludes(/node_modules/);
            },
          }),
        ],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should allow to use Less plugins', async () => {
    class MockPlugin {
      options?: unknown;
      constructor(options?: unknown) {
        this.options = options;
      }
      install() {}
    }

    const mockPlugin = new MockPlugin({ foo: 'bar' });
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginLess({
            lessLoaderOptions: {
              lessOptions: {
                plugins: [mockPlugin],
              },
            },
          }),
        ],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();

    expect(matchRules(rspackConfigs[0], 'a.less')).toMatchSnapshot();
  });

  it('should allow to add multiple less rules', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginLess({
            include: [/a\.less/, /b\.less/],
          }),
          pluginLess({
            include: /b\.less/,
          }),
        ],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.less').length).toBe(1);
    expect(matchRules(rspackConfigs[0], 'b.less').length).toBe(2);
  });

  it('should configure Rspack loader cache when `cache` is true', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          pluginLess({
            cache: true,
          }),
        ],
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    const [lessRule] = matchRules(rspackConfigs[0], 'a.less') as Array<{
      oneOf: Array<{
        use?: Array<{ loader?: string; cache?: boolean }>;
      }>;
    }>;

    const usesWithUse = lessRule.oneOf.filter((item) => item.use?.length);
    expect(usesWithUse).toHaveLength(3);

    for (const branch of usesWithUse) {
      const uses = branch.use ?? [];
      const lessUses = uses.filter((use) =>
        use.loader?.includes('less-loader'),
      );
      const otherUses = uses.filter(
        (use) => !use.loader?.includes('less-loader'),
      );

      expect(lessUses).toHaveLength(1);
      expect(lessUses[0].cache).toBe(true);
      expect(otherUses.every((use) => use.cache === undefined)).toBe(true);
    }
  });
});
