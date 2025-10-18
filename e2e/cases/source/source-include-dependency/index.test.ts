import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { outputFileSync } from 'fs-extra';

// https://github.com/web-infra-dev/rsbuild/issues/6372
test('should include dependency via `source.include` and `require.resolve`', async ({
  build,
}) => {
  const packagePath = join(__dirname, 'node_modules', 'test');
  outputFileSync(
    join(packagePath, 'index.js'),
    'export const value = window?.value;',
  );
  outputFileSync(
    join(packagePath, 'package.json'),
    JSON.stringify({ name: 'test', main: 'index.js' }),
  );

  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeFalsy();
  expect(
    rsbuild.logs.find((log) => log.includes('Syntax check passed')),
  ).toBeTruthy();
});
