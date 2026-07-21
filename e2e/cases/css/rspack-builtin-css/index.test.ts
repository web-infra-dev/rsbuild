import { expect, test } from '@e2e/helper';
import { getFileContent } from '@rstackjs/test-utils';

const COMPILE_WARNING = 'Compile Warning';

test('should use Rspack built-in CSS', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.css');

  expect(content).toContain('body{color:red}');
  expect(content).toContain('.less{color:green}');
  expect(content).toContain('.sass{color:#00f}');
  expect(content).toContain('color:#010203');
  expect(content).toContain('color:#040506');
  // should have no warnings
  rsbuild.expectNoLog(COMPILE_WARNING);
});

test('should use built-in style injection', async ({ page, buildPreview }) => {
  const rsbuild = await buildPreview({
    config: {
      output: {
        injectStyles: true,
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, 'index.js');
  expect(content).toContain('color:red');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            globalThis as typeof globalThis & {
              testStyles: { less: string; sass: string };
            }
          ).testStyles,
      ),
    )
    .toMatchObject({ less: expect.any(String), sass: expect.any(String) });

  // should have no warnings
  rsbuild.expectNoLog(COMPILE_WARNING);
});
