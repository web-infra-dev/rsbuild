import { expect, getFileContent, test } from '@e2e/helper';

type CssUrlResult = {
  aStyleContent: string;
  aStyleUrl: string;
  bStyleContent: string;
  bStyleUrl: string;
  styleUrl: string;
  styleContent: string;
  targetColor: string;
};

test('should return transformed CSS URL with `?url`', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    const {
      aStyleContent,
      aStyleUrl,
      bStyleContent,
      bStyleUrl,
      styleUrl,
      styleContent,
      targetColor,
    } = await page.evaluate<CssUrlResult>('window.getCssUrlResult()');

    expect(styleUrl).toMatch(/\/static\/css\/src\/style\.css$/);
    expect(styleContent).toContain('.url-query-class');
    expect(styleContent).toContain('--postcss-transformed');
    expect(aStyleUrl).toMatch(/\/static\/css\/src\/a\/index\.css$/);
    expect(aStyleContent).toContain('.a-index');
    expect(bStyleUrl).toMatch(/\/static\/css\/src\/b\/index\.css$/);
    expect(bStyleContent).toContain('.b-index');
    expect(aStyleUrl).not.toBe(bStyleUrl);
    expect(targetColor).toBe('rgb(0, 0, 0)');

    if (mode === 'build') {
      const html = getFileContent(result.getDistFiles(), 'index.html');
      expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/);
    }
  });
});
