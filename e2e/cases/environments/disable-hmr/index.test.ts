import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to disable HMR and live reload for a specified environment',
  async ({ dev }) => {
    const rsbuild = await dev({
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'all-in-one',
          },
        },
        environments: {
          foo: {
            source: {
              entry: {
                foo: './src/foo.js',
              },
            },
          },
          bar: {
            source: {
              entry: {
                bar: './src/bar.js',
              },
            },
            dev: {
              hmr: false,
              liveReload: false,
            },
          },
        },
      },
    });

    const files = rsbuild.getDistFiles();
    const filenames = Object.keys(files);

    const fooJs = filenames.find((filename) =>
      filename.includes('dist/static/js/foo.js'),
    );
    const barJs = filenames.find((filename) =>
      filename.includes('dist/static/js/bar.js'),
    );
    const fooContent = files[fooJs!];
    const barContent = files[barJs!];

    expect(fooContent.includes('dist/client/hmr.js')).toBeTruthy();
    expect(barContent.includes('dist/client/hmr.js')).toBeFalsy();
  },
);
