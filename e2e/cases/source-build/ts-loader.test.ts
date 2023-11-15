import { join } from 'path';
import { expect } from '@playwright/test';
import { webpackOnlyTest } from '@scripts/helper';
import { dev, getHrefByEntryName } from '@scripts/shared';
import { pluginSourceBuild } from '@rsbuild/plugin-source-build';
import { pluginReact } from '@rsbuild/plugin-react';

const fixture = join(__dirname, 'app-ts-loader');

webpackOnlyTest(
  'should build succeed with default ts-loader options',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: fixture,
      plugins: [pluginSourceBuild(), pluginReact()],
    });

    await page.goto(getHrefByEntryName('index', rsbuild.port));

    const locator = page.locator('#root');
    await expect(locator).toHaveText('1.0.0');

    await rsbuild.server.close();
  },
);
