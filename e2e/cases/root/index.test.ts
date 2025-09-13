import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import fse from 'fs-extra';

test('should support setting a relative root path', async ({ build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      root: './test',
    },
  });

  const index = await rsbuild.getIndexBundle();
  expect(index).toBeTruthy();
  expect(rsbuild.distPath).toContain('test');
});

test('should support setting an absolute root path', async ({ build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      root: join(__dirname, './test'),
    },
  });

  const index = await rsbuild.getIndexBundle();
  expect(index).toBeTruthy();
  expect(rsbuild.distPath).toContain('test');
});

test('should serve publicDir correctly when setting root', async ({
  page,
  devOnly,
}) => {
  await fse.outputFile(
    join(__dirname, 'test/public', 'test-temp-file.txt'),
    'a',
  );

  const rsbuild = await devOnly({
    rsbuildConfig: {
      root: './test',
    },
  });

  const res = await page.goto(
    `http://localhost:${rsbuild.port}/test-temp-file.txt`,
  );

  expect((await res?.body())?.toString().trim()).toBe('a');
});
