import { join } from 'path';
import { expect } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { dev, getHrefByEntryName } from '@scripts/shared';
import { pluginSourceBuild } from '@rsbuild/plugin-source-build';
import { pluginReact } from '@rsbuild/plugin-react';

const fixture = join(__dirname, 'app');

webpackOnlyTest(
  'should build succeed with source build plugin',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: fixture,
      entry: {
        index: join(fixture, 'src/index.tsx'),
      },
      plugins: [pluginSourceBuild(), pluginReact()],
    });

    await page.goto(getHrefByEntryName('index', rsbuild.port));

    const locator = page.locator('#root');
    await expect(locator).toHaveText(
      'Card Comp Title: AppCARD COMP CONTENT:hello world',
    );

    await rsbuild.server.close();
  },
);
