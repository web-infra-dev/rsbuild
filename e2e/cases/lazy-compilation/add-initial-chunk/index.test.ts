import { expect, rspackOnlyTest } from '@e2e/helper';

// https://github.com/web-infra-dev/rspack/issues/6633
rspackOnlyTest(
  'should render pages correctly when using lazy compilation and add new initial chunk',
  async ({ page, dev }) => {
    await dev();

    await expect(page.locator('#test')).toHaveText('Hello World!');
  },
);
