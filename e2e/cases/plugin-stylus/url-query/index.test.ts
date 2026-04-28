import { expect, getFileContent, test } from '@e2e/helper';

type StylusUrlResult = {
  styleContent: string;
  styleUrl: string;
  targetColor: string;
};

test('should return transformed Stylus URL with `?url`', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    const { styleContent, styleUrl, targetColor } =
      await page.evaluate<StylusUrlResult>('window.getStylusUrlResult()');

    expect(styleUrl).toMatch(/\/static\/css\/style\.css$/);
    expect(styleContent).toContain('.url-query-stylus');
    expect(styleContent).toMatch(/\.url-query-stylus:{1,2}after/);
    expect(targetColor).toBe('rgb(0, 0, 0)');

    if (mode === 'build') {
      const html = getFileContent(result.getDistFiles(), 'index.html');
      expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/);
    }
  });
});
