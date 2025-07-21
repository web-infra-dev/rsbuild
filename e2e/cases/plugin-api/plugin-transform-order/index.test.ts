import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow plugin to specify the execution order via `order`',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    const indexJs = await rsbuild.getIndexFile();
    expect(indexJs.content).toContain('with order: pre');
  },
);
