import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

const cwd = __dirname;

rspackTest(
  'HMR should work when Fast Refresh is disabled',
  async ({ page, dev }) => {
    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    await dev({
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
    await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');

    const appPath = join(cwd, 'test-temp-src/App.tsx');
    await fs.promises.writeFile(
      appPath,
      fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );
    await expect(locator).toHaveText('Hello Test!');
  },
);
