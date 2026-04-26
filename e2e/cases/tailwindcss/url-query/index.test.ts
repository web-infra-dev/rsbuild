import { expect, getFileContent, test } from '@e2e/helper';

type TailwindUrlResult = {
  styleContent: string;
  styleUrl: string;
};

test('should return transformed Tailwind CSS URL with `?url`', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async ({ mode, result }) => {
    const { styleContent, styleUrl } = await page.evaluate<TailwindUrlResult>(
      'window.getTailwindUrlResult()',
    );

    expect(styleUrl).toMatch(/\/static\/css\/index\.css$/);
    expect(styleContent).toContain('.text-3xl');
    expect(styleContent).toContain('.font-bold');
    expect(styleContent).toContain('.underline');

    if (mode === 'build') {
      const html = getFileContent(result.getDistFiles(), 'index.html');
      expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/);
    }
  });
});
