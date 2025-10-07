import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should print changed files in logs',
  async ({ cwd, page, dev, editFile }) => {
    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    const rsbuild = await dev({
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

    await editFile('test-temp-src/App.tsx', (code) =>
      code.replace('Hello Rsbuild!', 'Hello Rsbuild2!'),
    );

    await rsbuild.expectLog(/building test-temp-src[\\/]App\.tsx/);
  },
);

rspackTest('should print removed files in logs', async ({ cwd, page, dev }) => {
  await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
    recursive: true,
  });

  const rsbuild = await dev({
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

  const appPath = join(cwd, 'test-temp-src/App.tsx');

  await fs.promises.unlink(appPath);

  await rsbuild.expectLog(/building removed test-temp-src[\\/]App\.tsx/);
});
