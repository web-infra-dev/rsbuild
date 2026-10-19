import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { CREATE_RSBUILD_BIN_PATH, expect, test } from '@e2e/helper';
import { createAndValidate } from './helper';

test('should create vanilla project as expected', async () => {
  await createAndValidate(import.meta.dirname, 'vanilla');
});

test('should create vanilla-ts project as expected', async () => {
  await createAndValidate(import.meta.dirname, 'vanilla-ts');
});

test('should allow to create project in sub dir', async () => {
  await createAndValidate(import.meta.dirname, 'vanilla', {
    name: 'test-temp-dir/rsbuild-project',
  });
});

test('should allow to create project in relative dir', async () => {
  await createAndValidate(import.meta.dirname, 'vanilla', {
    name: './test-temp-relative-dir',
  });
});

test.each([0, 2])(
  'should delegate TanStack Start to Rsbuild and forward exit code %i',
  (exitCode) => {
    const result = spawnSync(
      process.execPath,
      [
        CREATE_RSBUILD_BIN_PATH,
        'my projects/start-app',
        '--template',
        'tanstack-start',
        '--package-name',
        'start-app',
        '--no-git',
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${path.join(import.meta.dirname, 'src')}${path.delimiter}${process.env.PATH}`,
          MOCK_NPX_EXIT_CODE: String(exitCode),
        },
      },
    );

    expect(result.status).toBe(exitCode);
    expect(result.stdout).toContain(
      JSON.stringify([
        '@tanstack/cli@latest',
        'create',
        '--framework',
        'React',
        '--build-tool',
        'rsbuild',
        '--target-dir',
        path.resolve('my projects/start-app'),
        'start-app',
        '--no-git',
      ]),
    );
  },
);
