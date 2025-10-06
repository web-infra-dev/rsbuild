import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'HMR should work by default',
  async ({ cwd, page, dev, editFile }) => {
    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    await dev({
      config: {
        source: {
          entry: {
            index: join(cwd, 'test-temp-src/index.ts'),
          },
        },
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');
    await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');

    const locatorKeep = page.locator('#test-keep');
    const keepNum = await locatorKeep.innerHTML();

    await editFile('test-temp-src/App.tsx', (code) =>
      code.replace('Hello Rsbuild', 'Hello Test'),
    );

    await expect(locator).toHaveText('Hello Test!');

    // #test-keep should remain unchanged when app.tsx HMR
    expect(await locatorKeep.innerHTML()).toBe(keepNum);

    await editFile(
      'test-temp-src/App.css',
      () => `#test {
  color: rgb(0, 0, 255);
}`,
    );

    await expect(locator).toHaveCSS('color', 'rgb(0, 0, 255)');
  },
);
