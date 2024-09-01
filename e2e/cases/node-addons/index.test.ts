import fs from 'node:fs';
import { join } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import fse from 'fs-extra';

test('should compile Node addons correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const addonFile = Object.keys(files).find((file) =>
    file.endsWith('test.darwin.node'),
  );

  expect(addonFile?.includes('/test.darwin.node')).toBeTruthy();

  expect(
    fs.existsSync(join(__dirname, 'dist', 'test.darwin.node')),
  ).toBeTruthy();

  // the `test.darwin.node` is only compatible with darwin
  if (process.platform === 'darwin') {
    const content = await import('./dist/index.js' as string);
    expect(typeof content.default.readLength).toEqual('function');
  }
});

test('should compile Node addons in the node_modules correctly', async () => {
  const pkgDir = join(__dirname, 'node_modules', 'node-addon-pkg');

  fs.rmSync(pkgDir, { recursive: true, force: true });

  fse.outputJSONSync(join(pkgDir, 'package.json'), {
    name: 'node-addon-pkg',
    main: 'src/index.js',
  });
  fse.outputFileSync(
    join(pkgDir, 'src', 'index.js'),
    `import addon from './other.node'; export default addon;`,
  );
  fse.ensureDirSync(join(pkgDir, 'src'));
  fs.copyFileSync(
    join(__dirname, 'src', 'test.darwin.node'),
    join(pkgDir, 'src', 'other.node'),
  );

  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: './src/other.js',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const addonFile = Object.keys(files).find((file) =>
    file.endsWith('other.node'),
  );

  expect(addonFile?.includes('/other.node')).toBeTruthy();

  expect(fs.existsSync(join(__dirname, 'dist', 'other.node'))).toBeTruthy();

  if (process.platform === 'darwin') {
    const content = await import('./dist/index.js' as string);
    expect(typeof content.default.readLength).toEqual('function');
  }
});
