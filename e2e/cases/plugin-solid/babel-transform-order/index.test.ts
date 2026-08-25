import { expect, gotoPage, test } from '@e2e/helper';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';

const renameButtonId = () => ({
  visitor: {
    JSXAttribute(path: {
      node: {
        name: { name?: string };
        value: { type?: string; value?: string } | null;
      };
    }) {
      const { name, value } = path.node;
      if (
        name.name === 'id' &&
        value?.type === 'StringLiteral' &&
        value.value === 'button'
      ) {
        value.value = 'babel-button';
      }
    },
  },
});

for (const [name, include, compiler] of [
  ['embedded Babel loader', undefined, 'native'],
  ['standalone Babel rule', /\.jsx$/, 'babel'],
] as const) {
  test(`should run ${name} before Solid compilation`, async ({
    page,
    build,
  }) => {
    const rsbuild = await build({
      cwd: import.meta.dirname,
      runServer: true,
      config: {
        performance: {
          buildCache: false,
        },
        plugins: [
          pluginBabel({
            include,
            babelLoaderOptions: {
              plugins: [renameButtonId],
            },
          }),
          pluginSolid({ compiler }),
        ],
      },
    });

    await gotoPage(page, rsbuild);
    await expect(page.locator('#babel-button')).toHaveText('button');
  });
}
