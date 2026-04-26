import { expect, test } from '@e2e/helper';

type TailwindUrlResult = {
  styleContent: string;
  styleUrl: string;
};

test('should return transformed Tailwind CSS URL with `?url`', async ({
  page,
  runBothServe,
}) => {
  await runBothServe(async () => {
    const { styleContent, styleUrl } = await page.evaluate<TailwindUrlResult>(
      'window.getTailwindUrlResult()',
    );

    expect(styleUrl).toMatch(/\/static\/css\/index\.css$/);
    expect(styleContent).toContain('.underline');
  });
});
