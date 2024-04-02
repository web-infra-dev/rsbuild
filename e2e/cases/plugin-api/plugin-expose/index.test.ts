import { test, expect } from '@playwright/test';
import { type RsbuildPlugin, createRsbuild } from '@rsbuild/core';

type ParentAPI = {
  initial: number;
  double: (val: number) => number;
};

test('should allow plugin to expose and consume API', async () => {
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
