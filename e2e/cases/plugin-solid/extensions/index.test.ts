import path from 'node:path';
import { expect, gotoPage, test } from '@e2e/helper';
import { pluginSolid } from '@rsbuild/plugin-solid';
import { getFileContent } from '@rstackjs/test-utils';

const extensions = ['.mjsx', '.cjsx', '.mtsx', '.ctsx', '.solid'];

for (const compiler of ['native', 'babel'] as const) {
  const config = {
    plugins: [pluginSolid({ compiler, extensions })],
  };

  test(`should build additional Solid extensions with ${compiler}`, async ({
    build,
    page,
  }) => {
    const rsbuild = await build({
      runServer: true,
      config: {
        ...config,
        output: { sourceMap: { js: 'source-map' } },
      },
    });
    await gotoPage(page, rsbuild);

    for (const ext of extensions) {
      await expect(page.locator(`#${ext.slice(1)}`)).toHaveText(ext.slice(1));
    }
    await expect(page.locator('#raw')).toContainText('<p id="solid">');

    const sourceMap = JSON.parse(
      getFileContent(
        rsbuild.getDistFiles({ sourceMaps: true }),
        'index.js.map',
      ),
    ) as { sources: string[] };
    for (const ext of extensions) {
      expect(
        sourceMap.sources.some((source) =>
          source.endsWith(`/${ext.slice(1)}${ext}`),
        ),
      ).toBe(true);
    }
  });

  test(`should preserve state when updating Solid extensions with ${compiler}`, async ({
    dev,
    page,
    editFile,
    copySrcDir,
  }) => {
    const src = await copySrcDir();
    await dev({
      config: {
        ...config,
        source: { entry: { index: path.join(src, 'index.jsx') } },
      },
    });
    const count = page.locator('#count');
    await count.click();
    await expect(count).toHaveText('1');

    for (const ext of extensions) {
      const name = ext.slice(1);
      await editFile(path.join(src, `${name}${ext}`), (code) =>
        code.replace(`'${name}'`, `'${name} updated'`),
      );
      await expect(page.locator(`#${name}`)).toHaveText(`${name} updated`);
      await expect(count).toHaveText('1');
    }
  });
}
