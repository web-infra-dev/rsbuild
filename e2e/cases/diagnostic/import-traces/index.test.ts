import { expect, test } from '@e2e/helper';

const EXPECTED_LOG = `Import traces (entry → error):
  ./src/index.js
  ./src/child1.js
  ./src/child2.js
  ./src/child3.js ×`;

test('should print import traces if module build failed', async ({
  runDevAndBuild,
}) => {
  await runDevAndBuild(
    async ({ mode, result }) => {
      if (mode === 'build') {
        expect(result.buildError).toBeTruthy();
      }
      await result.expectLog(EXPECTED_LOG);
    },
    {
      serve: false,
      options: { catchBuildError: true },
    },
  );
});
