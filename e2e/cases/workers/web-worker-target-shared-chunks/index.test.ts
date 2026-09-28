import { expect, test } from '@e2e/helper';
import { findFile } from '@rstackjs/test-utils';

for (const type of ['classic', 'module'] as const) {
  test(`should load shared chunks in ${type} workers`, async ({
    page,
    runBothServe,
  }) => {
    await runBothServe(
      async ({ result }) => {
        expect(findFile(result.getDistFiles(), 'shared.js')).toBeTruthy();
        await expect(page.locator('#double')).toHaveText('42');
        await expect(page.locator('#triple')).toHaveText('63');
      },
      {
        config: {
          source: {
            define: {
              'import.meta.env.WORKER_TYPE': JSON.stringify(type),
            },
          },
          environments: {
            worker: {
              output: { module: type === 'module' },
            },
          },
        },
      },
    );
  });
}
