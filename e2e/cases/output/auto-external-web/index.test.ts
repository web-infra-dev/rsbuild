import { join } from 'node:path';
import { expect, getFileContent, test } from '@e2e/helper';
import type { RsbuildConfig } from '@rsbuild/core';

const fixtures = join(import.meta.dirname, '../auto-external-fixtures');
const resolveAlias = {
  '@e2e/auto-external-pkg': join(fixtures, 'auto-external-pkg'),
  '@e2e/auto-external-dev-pkg': join(fixtures, 'auto-external-dev-pkg'),
  '@e2e/auto-external-peer-pkg': join(fixtures, 'auto-external-peer-pkg'),
};

const getConfig = (output: RsbuildConfig['output']): RsbuildConfig => ({
  resolve: {
    alias: resolveAlias,
  },
  source: {
    entry: {
      index: './src/index.js',
    },
  },
  output,
});

test('should auto externalize dependencies for web ESM output', async ({
  build,
}) => {
  const rsbuild = await build({
    config: getConfig({
      target: 'web',
      module: true,
      autoExternal: true,
    }),
  });
  const files = rsbuild.getDistFiles();
  const content = getFileContent(files, '.js');

  expect(content).toMatch(/import(?:[^;]*from)?"@e2e\/auto-external-pkg"/);
  expect(content).toMatch(
    /import(?:[^;]*from)?"@e2e\/auto-external-pkg\/subpath"/,
  );
  expect(content).toMatch(/import(?:[^;]*from)?"@e2e\/auto-external-peer-pkg"/);
  expect(content).not.toContain('@e2e/auto-external-dev-pkg');
});
