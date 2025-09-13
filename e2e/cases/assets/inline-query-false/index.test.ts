import { expect, test } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

test('should disable asset inlining with `?__inline=false`', async ({
  page,
  buildPreview,
}) => {
  await buildPreview({
    plugins: [pluginReact()],
  });

  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/image/icon')`,
    ),
  ).resolves.toBeTruthy();
});
