import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

test('should inline scripts in web ESM bundles', async ({
  page,
  runBothServe,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await runBothServe(async ({ mode, result }) => {
    await expect(page.locator('#test')).toHaveText('Inline scripts loaded!');

    const files = result.getDistFiles();
    const html = getFileContent(files, 'index.html');

    if (mode === 'dev') {
      expect(html).toContain('<script type="module" src="');
      return;
    }

    expect(html.match(/<script type="module">/g)).toHaveLength(1);
    expect(html).not.toContain('<script type="module" src="');
    expect(
      Object.keys(files).filter((filename) => filename.endsWith('.js')),
    ).toEqual([]);
  });

  expect(pageErrors).toEqual([]);
});
