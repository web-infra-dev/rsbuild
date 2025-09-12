import { expect, test } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

test('should inline assets with `?inline`', async ({ page, build }) => {
  await build({
    plugins: [pluginReact()],
  });

  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.startsWith('data:image/png')`,
    ),
  ).resolves.toBeTruthy();
});
