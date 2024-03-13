import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

const cases = [
  {
    name: 'assets(default)',
    cwd: join(fixtures, 'assets'),
    expected: 'inline',
  },
  {
    name: 'assets(dataUriLimit 0)',
    cwd: join(fixtures, 'assets'),
    config: {
      output: {
        dataUriLimit: 0,
      },
    },
    expected: 'url',
  },
  {
    name: 'assets(dataUriLimit.image 0)',
    cwd: join(fixtures, 'assets'),
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
    cwd: join(fixtures, 'assets'),
    config: {
      output: {
        dataUriLimit: {
          image: Number.MAX_SAFE_INTEGER,
        },
      },
    },
    expected: 'inline',
  },
  {
    name: 'assets-url',
    cwd: join(fixtures, 'assets-url'),
    expected: 'url',
  },
  {
    name: 'assets-no-inline',
    cwd: join(fixtures, 'assets-no-inline'),
    expected: 'url',
  },
  {
    name: 'assets__inline',
    cwd: join(fixtures, 'assets__inline'),
    expected: 'inline',
  },
  {
    name: 'assets-inline',
    cwd: join(fixtures, 'assets-inline'),
    expected: 'inline',
  },
];

cases.forEach((_case) => {
  test(_case.name, async ({ page }) => {
    const rsbuild = await build({
      cwd: _case.cwd,
      runServer: true,
      plugins: [pluginReact()],
      rsbuildConfig: _case.config || {},
    });

    await gotoPage(page, rsbuild);

    if (_case.expected === 'url') {
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
});
