import { expect, test } from '@e2e/helper';
import { pluginSolid } from '@rsbuild/plugin-solid';

for (const compiler of ['native', 'babel'] as const) {
  for (const mode of ['dev', 'preview'] as const) {
    const options = {
      config: {
        plugins: [pluginSolid({ compiler, ssr: true })],
        output: { distPath: { root: `dist-${compiler}` } },
      },
    };

    test(`should server-render HTML with ${compiler} in ${mode}`, async ({
      devOnly,
      build,
    }) => {
      const result =
        mode === 'dev'
          ? await devOnly(options)
          : await build({ ...options, runServer: true });
      const response = await fetch(`http://localhost:${result.port}`);
      const html = (await response.text()).replace(/<!--.*?-->/gs, '');

      expect(response.status).toBe(200);
      expect(html).toMatch(/<button[^>]*id="button"[^>]*>count: 0<\/button>/);
    });

    test(`should hydrate existing DOM with ${compiler} in ${mode}`, async ({
      page,
      devOnly,
      build,
    }) => {
      const result =
        mode === 'dev'
          ? await devOnly(options)
          : await build({ ...options, runServer: true });
      await page.goto(`http://localhost:${result.port}`);

      const serverButton = await page.evaluateHandle('window.ssrButton');
      const button = page.locator('#button');
      await button.click();
      await expect(button).toHaveText('count: 1');
      expect(
        await button.evaluate(
          (node, original) => node === original,
          serverButton,
        ),
      ).toBe(true);
    });
  }
}
