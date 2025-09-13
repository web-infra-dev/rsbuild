import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

const cwd = __dirname;

rspackTest(
  'HMR should work after fixing compilation error',
  async ({ page, dev, editFile }) => {
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

    await editFile('test-temp-src/App.tsx', (code) =>
      code.replace(
        '<div id="test">Hello Rsbuild!</div>',
        '<div id="test">Hello Rsbuild!</div',
      ),
    );

    await rsbuild.expectLog('Module build failed');

    await editFile('test-temp-src/App.tsx', (code) =>
      code.replace(
        '<div id="test">Hello Rsbuild!</div',
        '<div id="test">Hello Rsbuild2!</div>',
      ),
    );

    await expect(locator).toHaveText('Hello Rsbuild2!');
  },
);
