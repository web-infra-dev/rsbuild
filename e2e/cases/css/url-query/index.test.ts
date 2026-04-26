import { expect, getFileContent, test } from '@e2e/helper';

type CssUrlResult = {
  styleUrl: string;
  styleContent: string;
  targetColor: string;
};

test('should return transformed CSS URL with `?url`', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    const { styleUrl, styleContent, targetColor } =
      await page.evaluate<CssUrlResult>('window.getCssUrlResult()');

    expect(styleUrl).toMatch(/\/static\/css\/style\.css$/);
    expect(styleContent).toContain('.url-query-class');
    expect(styleContent).toContain('--postcss-transformed');
    expect(targetColor).toBe('rgb(0, 0, 0)');

    if (mode === 'build') {
      const html = getFileContent(result.getDistFiles(), 'index.html');
      expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/);
    }
  });
});
