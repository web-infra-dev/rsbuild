import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should build Vue SFC with lang="ts" correctly',
  async ({ page, buildPreview }) => {
    await buildPreview();

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0 foo: bar');
  },
);
