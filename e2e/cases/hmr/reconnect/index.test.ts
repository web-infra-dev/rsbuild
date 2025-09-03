import fs from 'node:fs';
import { join } from 'node:path';
import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

const cwd = __dirname;

rspackOnlyTest(
  'should reconnect Web Socket server as expected',
  async ({ page }) => {
    await fs.promises.cp(join(cwd, 'src'), join(cwd, 'test-temp-src'), {
      recursive: true,
    });

    const entry = {
      index: join(cwd, 'test-temp-src/index.ts'),
    };

    const rsbuild = await dev({
      cwd,
      page,
      rsbuildConfig: {
        source: { entry },
      },
    });

    const locator = page.locator('#test');
    await expect(locator).toHaveText('Hello Rsbuild!');

    const { port } = rsbuild;
    await rsbuild.close();

    const rsbuild2 = await dev({
      cwd,
      rsbuildConfig: {
        server: { port },
        source: { entry },
      },
    });

    const appPath = join(cwd, 'test-temp-src/App.tsx');
    await fs.promises.writeFile(
      appPath,
      fs.readFileSync(appPath, 'utf-8').replace('Hello Rsbuild', 'Hello Test'),
    );
    await expect(locator).toHaveText('Hello Test!');

    await rsbuild2.close();
  },
);
