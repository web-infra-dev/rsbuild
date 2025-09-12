import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackOnlyTest } from '@e2e/helper';

const cwd = __dirname;

rspackOnlyTest(
  'HMR should work when dev.client.port is `<port>`',
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
        dev: {
          client: {
            port: '<port>',
          },
        },
      },
    });

    const appPath = join(cwd, 'test-temp-src/App.tsx');

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');

    await fs.promises.writeFile(
      appPath,
      fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );

    await expect(locator).toHaveText('Hello Test!');
  },
);
