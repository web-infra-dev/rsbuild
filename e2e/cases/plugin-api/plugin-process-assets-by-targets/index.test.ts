import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should process assets when target is web',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
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
  },
);

rspackOnlyTest(
  'should not process assets when target is not web',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
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
