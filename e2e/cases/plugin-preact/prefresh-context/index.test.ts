import fs from 'node:fs';
import path from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

rspackOnlyTest(
  'HMR should work properly with `createContext`',
  async ({ page }) => {
    // Prefresh does not work as expected on Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    const root = __dirname;
    const compFilePath = path.join(root, 'src/test-temp-B.jsx');
    const compSourceCode = `const B = (props) => {
  return <div id="B">B: {props.count}</div>;
};

export default B;
`;

    fs.writeFileSync(compFilePath, compSourceCode, 'utf-8');

    const rsbuild = await dev({
      cwd: root,
      page,
    });

    const a = page.locator('#A');
    const b = page.locator('#B');

    await expect(a).toHaveText('A: 0');
    await expect(b).toHaveText('B: 0');

    await a.click({ clickCount: 5 });
    await expect(a).toHaveText('A: 5');
    await expect(b).toHaveText('B: 5');

    // simulate a change to component B's source code
    fs.writeFileSync(
      compFilePath,
      compSourceCode.replace('B:', 'Beep:'),
      'utf-8',
    );

    await page.waitForFunction(() => {
      const aText = document.querySelector('#A')?.textContent;
      const bText = document.querySelector('#B')?.textContent;

      return (
        // the state (count) of A should be kept
        aText === 'A: 5' &&
        // content of B changed to `Beep: 5` means HMR has taken effect
        bText === 'Beep: 5'
      );
    });

    await rsbuild.close();
  },
);
