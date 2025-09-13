import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to import inline Stylus files in dev',
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

rspackTest(
  'should allow to import inline Stylus files in build',
  async ({ page, buildPreview }) => {
    await buildPreview();

    const aInline: string = await page.evaluate('window.aInline');
    const bInline: string = await page.evaluate('window.bInline');
    const bStyles: Record<string, string> =
      await page.evaluate('window.bStyles');

    expect(aInline).toBe('.header-class{color:red}');
    expect(bInline).toBe('.title-class{font-size:14px}');
    expect(bStyles['title-class']).toBeTruthy();
  },
);
