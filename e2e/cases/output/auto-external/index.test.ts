import { expect, getFileContent, test } from '@e2e/helper';

test('should not auto externalize package.json dependencies by default', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      source: {
        entry: {
          index: './src/index.js',
        },
      },
      output: {
        target: 'node',
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, '.js');

  expect(content).toContain('dep');
  expect(content).toContain('subpath');
  expect(content).toContain('dev');
  expect(content).toContain('peer');
  expect(content).not.toContain('external "auto-external-pkg"');
  expect(content).not.toContain('external "auto-external-pkg/subpath"');
  expect(content).not.toContain('external "auto-external-peer-pkg"');
});

test('should auto externalize dependencies and subpath imports', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      source: {
        entry: {
          index: './src/index.js',
        },
      },
      output: {
        target: 'node',
        autoExternal: true,
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, '.js');

  expect(content).toContain('external "auto-external-pkg"');
  expect(content).toContain('external "auto-external-pkg/subpath"');
  expect(content).toContain('external "auto-external-peer-pkg"');
  expect(content).not.toContain('external "auto-external-dev-pkg"');
  expect(content).toContain('dev');
});

test('should auto externalize devDependencies when enabled', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      source: {
        entry: {
          index: './src/index.js',
        },
      },
      output: {
        target: 'node',
        autoExternal: {
          devDependencies: true,
        },
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, '.js');

  expect(content).toContain('external "auto-external-dev-pkg"');
});
