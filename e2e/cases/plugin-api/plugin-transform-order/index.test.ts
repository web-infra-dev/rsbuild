import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow plugin to specify the execution order via `order`',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const indexJs = await rsbuild.getIndexBundle();
    expect(indexJs).toContain('with order: pre');
  },
);
