import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should output and run basic web ESM bundles', async ({
  page,
  runBothServe,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await runBothServe(async ({ result }) => {
    await expect(page.locator('#test')).toHaveText('Hello Web ESM!');
    await expect(page.locator('#test')).toHaveCSS('color', 'rgb(255, 0, 0)');

    const html = getFileContent(result.getDistFiles(), 'index.html');
    expect(html).toContain('<script type="module" src="');
  });

  expect(pageErrors).toEqual([]);
});
