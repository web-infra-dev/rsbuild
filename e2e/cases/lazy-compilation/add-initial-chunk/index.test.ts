import { expect, test } from '@e2e/helper';

// https://github.com/web-infra-dev/rspack/issues/6633
// TODO: fix
test.skip('should render pages correctly when using lazy compilation and add new initial chunk', async ({
  page,
  dev,
}) => {
  // TODO: fixme on Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  await dev();

  await expect(page.locator('#test')).toHaveText('Hello World!');
});
