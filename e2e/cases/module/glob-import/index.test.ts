import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should glob import components in dev build correctly',
  async ({ page, dev }) => {
    await dev();

    await expect(page.locator('#header')).toHaveText('Header');
    await expect(page.locator('#footer')).toHaveText('Footer');
  },
);

rspackTest(
  'should glob import components in build correctly',
  async ({ page, build }) => {
    await build();
    await expect(page.locator('#header')).toHaveText('Header');
    await expect(page.locator('#footer')).toHaveText('Footer');
  },
);
