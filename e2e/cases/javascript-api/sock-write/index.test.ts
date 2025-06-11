import { expectPoll, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';

rspackOnlyTest(
  'should allow to call `sockWrite` after creating dev server',
  async ({ page }) => {
    let count = 0;
    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });

    const server = await rsbuild.createDevServer();

    server.middlewares.use((_req, _res, next) => {
      count++;
      next();
    });

    await server.listen();
    await gotoPage(page, server);
    expectPoll(() => count > 0).toBeTruthy();

    const previousCount = count;
    server.sockWrite('static-changed');
    expectPoll(() => count > previousCount).toBeTruthy();
    await server.close();
  },
);
