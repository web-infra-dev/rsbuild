import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to import inline CSS files in development mode',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    await page.waitForFunction(
      'window.aInline && window.bInline && window.bStyles',
      undefined,
      { timeout: 1000 },
    );

    const aInline: string = await page.evaluate('window.aInline');
    const bInline: string = await page.evaluate('window.bInline');
    const bStyles: Record<string, string> =
      await page.evaluate('window.bStyles');

    expect(
      aInline.includes('.header-class') && aInline.includes('color: red'),
    ).toBe(true);
    expect(
      bInline.includes('.title-class') && bInline.includes('font-size: 14px'),
    ).toBe(true);
    expect(bStyles['title-class']).toBeTruthy();

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should allow to import inline CSS files in production mode',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const bStyles: Record<string, string> =
      await page.evaluate('window.bStyles');

    expect(await page.evaluate('window.aInline')).toBe(
      '.header-class{color:red}',
    );
    expect(await page.evaluate('window.bInline')).toBe(
      '.title-class{font-size:14px}',
    );
    expect(bStyles['title-class']).toBeTruthy();

    await rsbuild.close();
  },
);
