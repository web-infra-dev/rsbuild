import { expect, rspackOnlyTest } from '@e2e/helper';
import { createRsbuild, type RsbuildPlugin } from '@rsbuild/core';

type ParentAPI = {
  initial: number;
  double: (val: number) => number;
};

rspackOnlyTest('should allow plugin to expose and consume API', async () => {
  const parentSymbol = Symbol('parent-api');

  const pluginParent: RsbuildPlugin = {
    name: 'plugin-parent',
    setup(api) {
      api.expose<ParentAPI>(parentSymbol, {
        initial: 1,
        double: (val: number) => val * 2,
      });
    },
  };

  const pluginChild: RsbuildPlugin = {
    name: 'plugin-child',
    setup(api) {
      const parentAPI = api.useExposed<ParentAPI>(parentSymbol);
      expect(parentAPI?.double(parentAPI.initial)).toEqual(2);
    },
  };

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginParent, pluginChild],
    },
  });

  await rsbuild.build();
});
