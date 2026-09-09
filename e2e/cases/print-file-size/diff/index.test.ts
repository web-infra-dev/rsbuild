import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import fse from 'fs-extra';
import { extractFileSizeLogs } from '../helper';

for (const [type, detail] of [
  ['gzip', true],
  ['brotli', true],
  ['gzip', false],
  ['brotli', false],
] as const) {
  test(`should print ${type} ${detail ? '' : 'total '}size differences`, async ({
    cwd,
    build,
    editFile,
    copySrcDir,
  }) => {
    const cacheDir = join(cwd, 'node_modules/.cache');
    await fse.remove(cacheDir);
    const srcDir = await copySrcDir();
    const config = {
      performance: { printFileSize: { compressed: { type }, detail } },
      source: {
        entry: {
          index: join(srcDir, 'index.js'),
        },
      },
    };

    const rsbuild1 = await build({ config });
    expect(extractFileSizeLogs(rsbuild1.logs)).toMatchSnapshot();
    rsbuild1.clearLogs();

    await editFile(
      join(srcDir, 'index.js'),
      () => `import "./App.css";
import { createElement } from 'react';
import { flushSync } from 'react-dom';
console.log(createElement);
console.log(flushSync);
`,
    );

    const rsbuild2 = await build({ config });
    expect(extractFileSizeLogs(rsbuild2.logs)).toMatchSnapshot();
    rsbuild2.clearLogs();

    await editFile(join(srcDir, 'index.js'), () => `import "./App.css";`);

    const rsbuild3 = await build({ config });
    expect(extractFileSizeLogs(rsbuild3.logs)).toMatchSnapshot();
  });
}

test('should not print gzip total diff when change is below threshold', async ({
  cwd,
  build,
  copySrcDir,
}) => {
  const cacheDir = join(cwd, 'node_modules/.cache');
  await fse.remove(cacheDir);
  const srcDir = await copySrcDir();
  const config = {
    source: {
      entry: {
        index: join(srcDir, 'index.js'),
      },
    },
  };

  const rsbuild1 = await build({ config });

  const snapshotDir = join(rsbuild1.instance.context.cachePath, 'rsbuild');
  const snapshotFile = (await fse.readdir(snapshotDir)).find((filename) =>
    filename.startsWith('file-sizes'),
  );
  expect(snapshotFile).toBeTruthy();

  const snapshotPath = join(snapshotDir, snapshotFile!);
  const snapshots: Record<string, { totalGzipSize: number }> =
    await fse.readJSON(snapshotPath);
  const environmentName = Object.keys(snapshots)[0];

  expect(snapshots[environmentName].totalGzipSize).toBeGreaterThan(5);
  snapshots[environmentName].totalGzipSize -= 5;
  await fse.writeJSON(snapshotPath, snapshots, { spaces: 2 });

  rsbuild1.clearLogs();

  const rsbuild2 = await build({ config });

  expect(extractFileSizeLogs(rsbuild2.logs)).toMatchSnapshot();
});

test('should not compare compressed sizes across algorithms', async ({
  cwd,
  build,
}) => {
  await fse.remove(join(cwd, 'node_modules/.cache'));
  const compressions = [
    true,
    { type: 'brotli' },
    { type: 'gzip' },
    false,
    { type: 'brotli' },
  ] as const;
  for (const compressed of compressions) {
    const result = await build({
      config: { performance: { printFileSize: { compressed } } },
    });
    expect(extractFileSizeLogs(result.logs)).not.toMatch(/\([+-]/);
    result.clearLogs();
  }
});
