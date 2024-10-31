import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

const cases = [
  {
    name: 'assets(dataUriLimit 0)',
    cwd: __dirname,
    config: {
      output: {
        dataUriLimit: 0,
      },
    },
    expected: 'url',
  },
  {
    name: 'assets(dataUriLimit.image 0)',
    cwd: __dirname,
    config: {
      output: {
        dataUriLimit: {
          image: 0,
        },
      },
    },
    expected: 'url',
  },
  {
    name: 'assets(dataUriLimit max number)',
    cwd: __dirname,
    config: {
      output: {
        dataUriLimit: {
          image: Number.MAX_SAFE_INTEGER,
        },
      },
    },
    expected: 'inline',
  },
];

for (const item of cases) {
  test(item.name, async ({ page }) => {
    const rsbuild = await build({
      cwd: item.cwd,
      page,
      plugins: [pluginReact()],
      rsbuildConfig: item.config || {},
    });

    if (item.expected === 'url') {
      await expect(
        page.evaluate(
          `document.getElementById('test-img').src.includes('static/image/icon')`,
        ),
      ).resolves.toBeTruthy();
    } else {
      await expect(
        page.evaluate(
          `document.getElementById('test-img').src.startsWith('data:image/png')`,
        ),
      ).resolves.toBeTruthy();
    }

    await rsbuild.close();
  });
}
