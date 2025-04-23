import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should not emit CSS files when build node target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'node',
      },
    },
  });
  const files = await rsbuild.getDistFiles();

  // preserve CSS Modules mapping
  const jsContent =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];
  expect(jsContent.includes('"title-class":')).toBeTruthy();

  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  expect(cssFiles).toHaveLength(0);
});

test('should allow to emit CSS with output.emitCss when build node target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'node',
        emitCss: true,
      },
    },
  });
  const files = await rsbuild.getDistFiles();

  // preserve CSS Modules mapping
  const jsContent =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];
  expect(jsContent.includes('"title-class":')).toBeTruthy();

  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  expect(cssFiles).toHaveLength(1);
});

test('should not emit CSS files when build web-worker target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'web-worker',
      },
    },
  });
  const files = await rsbuild.getDistFiles();

  // preserve CSS Modules mapping
  const jsContent =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];
  expect(jsContent.includes('"title-class":')).toBeTruthy();

  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  expect(cssFiles).toHaveLength(0);
});

test('should allow to emit CSS with output.emitCss when build web-worker target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'web-worker',
        emitCss: true,
      },
    },
  });
  const files = await rsbuild.getDistFiles();

  // preserve CSS Modules mapping
  const jsContent =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];
  expect(jsContent.includes('"title-class":')).toBeTruthy();

  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  expect(cssFiles).toHaveLength(1);
});

test('should allow to disable CSS emit with output.emitCss when build web target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        target: 'web',
        emitCss: false,
      },
    },
  });
  const files = await rsbuild.getDistFiles();

  // preserve CSS Modules mapping
  const jsContent =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];
  expect(jsContent.includes('"title-class":')).toBeTruthy();

  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  expect(cssFiles).toHaveLength(0);
});
