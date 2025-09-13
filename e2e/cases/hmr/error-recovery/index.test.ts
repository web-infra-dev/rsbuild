import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

const cwd = __dirname;

rspackTest(
  'HMR should work after fixing compilation error',
  async ({ page, dev }) => {
    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    const rsbuild = await dev({
      rsbuildConfig: {
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

    await fs.promises.writeFile(
      appPath,
      fs
        .readFileSync(appPath, 'utf-8')
        .replace(
          '<div id="test">Hello Rsbuild!</div>',
          '<div id="test">Hello Rsbuild!</div',
        ),
    );

    await rsbuild.expectLog('Module build failed');

    await fs.promises.writeFile(
      appPath,
      fs
        .readFileSync(appPath, 'utf-8')
        .replace(
          '<div id="test">Hello Rsbuild!</div',
          '<div id="test">Hello Rsbuild2!</div>',
        ),
    );

    await expect(locator).toHaveText('Hello Rsbuild2!');
  },
);
