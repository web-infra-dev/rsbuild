import { expect, gotoPage, test } from '@e2e/helper';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { getFileContent } from '@rstackjs/test-utils';

for (const compiler of ['native', 'babel'] as const) {
  test(`should compile Solid JSX in a data URI with ${compiler}`, async ({
    build,
    page,
  }) => {
    const rsbuild = await build({
      runServer: true,
      config: {
        plugins: [pluginSolid({ compiler })],
      },
    });

    await gotoPage(page, rsbuild);
    await expect(page.locator('#data-uri')).toHaveText('data uri');
  });

  test(`should preserve the data URI source map with ${compiler}`, async ({
    build,
  }) => {
    const rsbuild = await build({
      config: {
        output: {
          sourceMap: {
            js: 'source-map',
          },
        },
        plugins: [pluginSolid({ compiler })],
      },
    });
    const sourceMap = JSON.parse(
      getFileContent(
        rsbuild.getDistFiles({ sourceMaps: true }),
        'index.js.map',
      ),
    ) as { sources: string[] };

    expect(
      sourceMap.sources.some((source) =>
        source.includes('data:text/javascript'),
      ),
    ).toBe(true);
  });
}
