import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';

rspackOnlyTest(
  'should allow to call `getStats` to get stats after creating dev server',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        environments: {
          node: {
            output: {
              target: 'node',
            },
          },
        },
      },
    });

    const server = await rsbuild.createDevServer();
    const stats = await server.environments.node.getStats();
    expect(
      typeof stats.toJson({
        all: false,
      }),
    ).toBe('object');
    await server.close();
  },
);
