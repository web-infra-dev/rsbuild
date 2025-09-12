import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, rspackOnlyTest } from '@e2e/helper';

const getContent = (
  classNames: string,
) => `document.querySelector('#root').className = '${classNames}';
`;

rspackOnlyTest('should support tailwindcss HMR', async ({ page, dev }) => {
  const tempFile = join(__dirname, 'src/test-temp-file.js');

  writeFileSync(tempFile, getContent('text-black'));

  await dev();

  await expect(page.locator('#root')).toHaveCSS('color', 'rgb(0, 0, 0)');

  writeFileSync(tempFile, getContent('text-white'));
  await expect(page.locator('#root')).toHaveCSS('color', 'rgb(255, 255, 255)');
});
