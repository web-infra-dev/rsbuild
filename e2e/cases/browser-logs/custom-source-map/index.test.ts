import { join, relative } from 'node:path';
import { rspackTest, toPosixPath } from '@e2e/helper';

const EXPECTED_LOG =
  'error   [browser] Uncaught Error: test (src/index.js:1:0)';

rspackTest(
  'should parse source map correctly if source path is absolute',
  async ({ dev }) => {
    const rsbuild = await dev({
      config: {
        tools: {
          rspack: {
            output: {
              devtoolModuleFilenameTemplate(info) {
                return toPosixPath(info.absoluteResourcePath);
              },
            },
          },
        },
      },
    });
    await rsbuild.expectLog(EXPECTED_LOG, { posix: true });
  },
);

rspackTest(
  'should parse source map correctly if source path is relative',
  async ({ dev }) => {
    const distPath = join(__dirname, 'dist');
    const rsbuild = await dev({
      config: {
        tools: {
          rspack: {
            output: {
              devtoolModuleFilenameTemplate(info) {
                return toPosixPath(
                  relative(distPath, info.absoluteResourcePath),
                );
              },
            },
          },
        },
      },
    });
    await rsbuild.expectLog(EXPECTED_LOG, { posix: true });
  },
);
