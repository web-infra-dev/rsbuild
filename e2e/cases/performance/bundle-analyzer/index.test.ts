import { join } from 'path';
import { expect, test } from '@playwright/test';
import { dev, build } from '@scripts/shared';
import { globContentJSON } from '@scripts/helper';

test('should emit bundle analyze report correctly when dev', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await page.goto(`http://localhost:${rsbuild.port}`);
  const testEl = page.locator('#test');
  await expect(testEl).toHaveText('Hello Rsbuild!');

  const files = await globContentJSON(join(__dirname, 'dist'));
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );
  expect(filePaths.length).toBe(1);

  await rsbuild.server.close();
});

test('should emit bundle analyze report correctly when build', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filePaths = Object.keys(files).filter((file) =>
    file.endsWith('report-web.html'),
  );

  expect(filePaths.length).toBe(1);
});
