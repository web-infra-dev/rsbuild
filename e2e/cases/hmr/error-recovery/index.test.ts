import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'HMR should work after fixing compilation error',
  async ({ page, dev, editFile, copySrcDir }) => {
    const tempSrc = await copySrcDir();

    const rsbuild = await dev({
      config: {
        source: {
          entry: {
            index: join(tempSrc, 'index.ts'),
          },
        },
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');

    await editFile(join(tempSrc, 'App.tsx'), (code) =>
      code.replace(
        '<div id="test">Hello Rsbuild!</div>',
        '<div id="test">Hello Rsbuild!</div',
      ),
    );

    await rsbuild.expectLog('Module build failed');

    await editFile(join(tempSrc, 'App.tsx'), (code) =>
      code.replace(
        '<div id="test">Hello Rsbuild!</div',
        '<div id="test">Hello Rsbuild2!</div>',
      ),
    );

    await expect(locator).toHaveText('Hello Rsbuild2!');
  },
);
