import fs from 'node:fs';
import { join } from 'node:path';
import { expect, gotoPage, rspackTest } from '@e2e/helper';

const cwd = __dirname;

rspackTest(
  'should allow to create multiple HMR connections',
  async ({ page: page1, context, devOnly, editFile }) => {
    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    const rsbuild = await devOnly({
      rsbuildConfig: {
        source: {
          entry: {
            index: join(cwd, 'test-temp-src/index.ts'),
          },
        },
      },
    });

    const page2 = await context.newPage();
    await gotoPage(page1, rsbuild);
    await gotoPage(page2, rsbuild);

    const locator1 = page1.locator('#test');
    const locator2 = page2.locator('#test');

    await expect(locator1).toHaveText('Hello Rsbuild!');
    await expect(locator2).toHaveText('Hello Rsbuild!');

    const locatorKeep1 = page1.locator('#test-keep');
    const locatorKeep2 = page2.locator('#test-keep');
    const keepNum1 = await locatorKeep1.innerHTML();
    const keepNum2 = await locatorKeep2.innerHTML();

    await editFile('test-temp-src/App.tsx', (code) =>
      code.replace('Hello Rsbuild', 'Hello Test'),
    );

    await expect(locator1).toHaveText('Hello Test!');
    await expect(locator2).toHaveText('Hello Test!');

    // #test-keep should remain unchanged when app.tsx HMR
    expect(await locatorKeep1.innerHTML()).toBe(keepNum1);
    expect(await locatorKeep2.innerHTML()).toBe(keepNum2);
  },
);
