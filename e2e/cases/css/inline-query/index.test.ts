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
      [
        'window.aInline1',
        'window.aInline2',
        'window.aInline3',
        'window.aInline4',
      ].join(' && '),
      undefined,
      { timeout: 1000 },
    );

    for (const key of ['aInline1', 'aInline2', 'aInline3', 'aInline4']) {
      const inline: string = await page.evaluate(`window.${key}`);
      expect(
        inline.includes('.header-class') && inline.includes('color: red'),
      ).toBe(true);
    }

    const bInline: string = await page.evaluate('window.bInline');
    const bStyles: Record<string, string> =
      await page.evaluate('window.bStyles');

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

    for (const key of ['aInline1', 'aInline2', 'aInline3', 'aInline4']) {
      const inline: string = await page.evaluate(`window.${key}`);
      expect(inline.includes('.header-class{color:red}')).toBe(true);
    }

    const bStyles: Record<string, string> =
      await page.evaluate('window.bStyles');

    expect(await page.evaluate('window.bInline')).toBe(
      '.title-class{font-size:14px}',
    );
    expect(bStyles['title-class']).toBeTruthy();

    await rsbuild.close();
  },
);
