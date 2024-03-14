import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';
import { join } from 'node:path';
import { fse } from '@rsbuild/shared';

function createFooPackage() {
  const fooPath = join(__dirname, 'node_modules', 'foo');

  fse.outputFileSync(
    join(fooPath, 'src/index.ts'),
    'export const foo: number = "foo"',
  );
  fse.outputJSONSync(join(fooPath, 'package.json'), {
    name: 'foo',
    version: '1.0.0',
    main: './src/index.ts',
  });
  fse.outputJSONSync(join(fooPath, 'tsconfig.json'), {
    include: ['src/index.ts'],
  });
}

test('should exclude type errors from node_modules', async () => {
  createFooPackage();
  await expect(build({ cwd: __dirname })).resolves.toBeTruthy();
});
