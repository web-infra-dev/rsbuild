import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

const cwd = __dirname;

rspackTest(
  'should reconnect Web Socket server as expected',
  async ({ page, dev, devOnly, editFile }) => {
    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    const entry = {
      index: join(cwd, 'test-temp-src/index.ts'),
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

    await editFile('test-temp-src/App.tsx', (code) =>
      code.replace('Hello Rsbuild', 'Hello Test'),
    );
    await expect(locator).toHaveText('Hello Test!');
  },
);
