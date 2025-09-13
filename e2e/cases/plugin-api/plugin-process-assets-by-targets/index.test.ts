import { expect, rspackTest } from '@e2e/helper';

rspackTest('should process assets when target is web', async ({ build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      output: {
        target: 'web',
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js'),
  );
  expect(indexJs).toBeFalsy();
});

rspackTest(
  'should not process assets when target is not web',
  async ({ build }) => {
    const rsbuild = await build({
      rsbuildConfig: {
        output: {
          target: 'web-worker',
        },
      },
    });

    const files = rsbuild.getDistFiles();
    const indexJs = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.js'),
    );
    expect(indexJs).toBeTruthy();
  },
);
