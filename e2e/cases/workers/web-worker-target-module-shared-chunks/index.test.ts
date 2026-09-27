import { expect, test } from '@e2e/helper';
import { findFile } from '@rstackjs/test-utils';

test('should load a shared chunk in module workers built with the web-worker target', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ result }) => {
    expect(findFile(result.getDistFiles(), 'shared.js')).toBeTruthy();
    await expect(page.locator('#double')).toHaveText('42');
    await expect(page.locator('#triple')).toHaveText('63');
  });
});
