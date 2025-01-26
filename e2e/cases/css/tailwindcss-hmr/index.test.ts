import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// Ensure tailwindcss only watch files in the current directory
process.chdir(__dirname);

const getContent = (
  classNames: string,
) => `document.querySelector('#root').className = '${classNames}';
`;

rspackOnlyTest('should support tailwindcss HMR', async ({ page }) => {
  // HMR cases will fail in Windows
  if (process.platform === 'win32') {
    test.skip();
  }

  const tempFile = join(__dirname, 'src/test-temp-file.js');

  writeFileSync(tempFile, getContent('text-black'));

  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await expect(page.locator('#root')).toHaveCSS('color', 'rgb(0, 0, 0)');

  writeFileSync(tempFile, getContent('text-white'));
  await expect(page.locator('#root')).toHaveCSS('color', 'rgb(255, 255, 255)');

  await rsbuild.close();
});
