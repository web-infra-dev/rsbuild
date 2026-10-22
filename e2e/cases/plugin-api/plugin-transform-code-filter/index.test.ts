import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';
import { getFileContent } from '@rstackjs/test-utils';

for (const codeFilter of ['__MARKER__', /__MARKER__/]) {
  test(`should filter transform input code with ${codeFilter}`, async ({
    runBoth,
  }) => {
    const transformed: string[] = [];

    await runBoth(
      ({ result }) => {
        expect(transformed).toEqual(['index.js']);
        transformed.length = 0;

        const bundle = getFileContent(result.getDistFiles(), 'index.js');
        expect(bundle).toContain('transformed');
        expect(bundle).toContain('unchanged');
        expect(bundle).not.toContain('__MARKER__');
      },
      {
        config: {
          plugins: [
            {
              name: 'filter-transform',
              setup(api) {
                api.transform(
                  { test: /\.js$/, codeFilter, order: 'post' },
                  ({ code, resourcePath }) => {
                    transformed.push(basename(resourcePath));
                    return code.replace('__MARKER__', 'transformed');
                  },
                );
              },
            } satisfies RsbuildPlugin,
          ],
        },
      },
    );
  });
}
