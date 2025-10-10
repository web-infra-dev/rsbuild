import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should reconnect WebSocket server as expected',
  async ({ page, dev, devOnly, editFile, copySrcDir }) => {
    const tempSrc = await copySrcDir();

    const entry = {
      index: join(tempSrc, 'index.ts'),
    };

    const rsbuild = await dev({
      config: {
        source: { entry },
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');

    const { port } = rsbuild;

    await devOnly({
      config: {
        server: { port },
        source: { entry },
      },
    });

    await editFile(join(tempSrc, 'App.tsx'), (code) =>
      code.replace('Hello Rsbuild', 'Hello Test'),
    );
    await expect(locator).toHaveText('Hello Test!');
  },
);
