import { expect, test } from '@e2e/helper';
import { createRsbuild, type RsbuildPlugin } from '@rsbuild/core';

type ParentAPI = {
  initial: number;
  double: (val: number) => number;
};

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

const pluginParent2: RsbuildPlugin = {
  name: 'plugin-parent2',
  setup(api) {
    api.expose<ParentAPI>(parentSymbol, {
      initial: 2,
      double: (val: number) => val * 2,
    });
  },
};

test('should allow plugin to expose and consume API', async () => {
  const pluginChild: RsbuildPlugin = {
    name: 'plugin-child',
    setup(api) {
      const parentAPI = api.useExposed<ParentAPI>(parentSymbol);
      expect(parentAPI?.double(parentAPI.initial)).toEqual(2);
    },
  };

  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      plugins: [pluginParent, pluginChild],
    },
  });
  await rsbuild.build();
});

test('should override the previous exposed API', async () => {
  const pluginChild: RsbuildPlugin = {
    name: 'plugin-child',
    setup(api) {
      const parentAPI = api.useExposed<ParentAPI>(parentSymbol);
      expect(parentAPI?.double(parentAPI.initial)).toEqual(4);
    },
  };

  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      plugins: [pluginParent, pluginParent2, pluginChild],
    },
  });
  await rsbuild.build();
});
