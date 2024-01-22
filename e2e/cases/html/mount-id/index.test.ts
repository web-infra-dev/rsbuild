import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';
import { build, gotoPage } from '@e2e/helper';

test.describe('should render mountId correctly', () => {
  let rsbuild: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    rsbuild = await build({
      cwd: __dirname,
      runServer: true,
      rsbuildConfig: {
        html: {
          mountId: 'app',
        },
      },
    });
  });

  test.afterAll(async () => {
    await rsbuild.close();
  });

  test('mountId', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await gotoPage(page, rsbuild);

    const test = page.locator('#test');
    await expect(test).toHaveText('Hello Rsbuild!');

    expect(errors).toEqual([]);
  });

  test('inject default (head)', async () => {
    const pagePath = join(rsbuild.distPath, 'index.html');
    const content = await fse.readFile(pagePath, 'utf-8');

    expect(
      /<head>[\s\S]*<script[\s\S]*>[\s\S]*<\/head>/.test(content),
    ).toBeTruthy();
    expect(
      /<body>[\s\S]*<script[\s\S]*>[\s\S]*<\/body>/.test(content),
    ).toBeFalsy();
  });
});
