import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should render element with classic JSX runtime in build',
  async ({ page, buildPreview }) => {
    await buildPreview();
    const testEl = page.locator('#test');
    await expect(testEl).toHaveText('Hello Rsbuild!');
  },
);

rspackTest(
  'should render element with classic JSX runtime in dev',
  async ({ page, dev }) => {
    await dev();
    const testEl = page.locator('#test');
    await expect(testEl).toHaveText('Hello Rsbuild!');
  },
);
