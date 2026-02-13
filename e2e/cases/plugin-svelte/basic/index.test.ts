import { expect, test } from '@e2e/helper';

test('should compile basic svelte component properly', async ({
  page,
  runDevAndBuild,
}) => {
  await runDevAndBuild(async () => {
    const title = page.locator('#title');
    await expect(title).toHaveText('Hello world!');
  });
});
