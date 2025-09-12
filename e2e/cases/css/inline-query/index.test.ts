import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to import inline CSS files in dev',
  async ({ page, dev }) => {
    await dev();

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
  },
);

rspackOnlyTest(
  'should allow to import inline CSS files in build',
  async ({ page, build }) => {
    const rsbuild = await build();

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
  },
);
