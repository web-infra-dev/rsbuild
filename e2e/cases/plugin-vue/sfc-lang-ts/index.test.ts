import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should build Vue SFC with lang="ts" correctly',
  async ({ page, build }) => {
    await build();

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0 foo: bar');
  },
);
