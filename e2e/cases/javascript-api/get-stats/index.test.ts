import { expect, rspackTest } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';

rspackTest(
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
