import { build, expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to import inline Less files in dev',
  async ({ page, dev }) => {
    await dev();

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
  },
);

rspackOnlyTest(
  'should allow to import inline Less files in build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const aInline: string = await page.evaluate('window.aInline');
    const bInline: string = await page.evaluate('window.bInline');
    const bStyles: Record<string, string> =
      await page.evaluate('window.bStyles');

    expect(aInline).toBe('.header-class{color:red}');
    expect(bInline).toBe('.title-class{font-size:14px}');
    expect(bStyles['title-class']).toBeTruthy();

    await rsbuild.close();
  },
);
