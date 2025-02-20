import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createAndValidate } from './helper';

rspackOnlyTest('should create project with eslint as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    __dirname,
    'vanilla',
    {
      name: 'test-temp-eslint',
      tools: ['eslint'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies.eslint).toBeTruthy();
  expect(existsSync(join(dir, 'eslint.config.mjs'))).toBeTruthy();
  await clean();
});

rspackOnlyTest('should create project with prettier as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    __dirname,
    'vanilla',
    {
      name: 'test-temp-prettier',
      tools: ['prettier'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies.prettier).toBeTruthy();
  expect(existsSync(join(dir, '.prettierrc'))).toBeTruthy();
  await clean();
});

rspackOnlyTest(
  'should create project with eslint and prettier as expected',
  async () => {
    const { dir, pkgJson, clean } = await createAndValidate(
      __dirname,
      'vanilla',
      {
        name: 'test-temp-eslint-prettier',
        tools: ['eslint', 'prettier'],
        clean: false,
      },
    );
    expect(pkgJson.devDependencies.eslint).toBeTruthy();
    expect(pkgJson.devDependencies.prettier).toBeTruthy();
    expect(existsSync(join(dir, '.prettierrc'))).toBeTruthy();
    expect(existsSync(join(dir, 'eslint.config.mjs'))).toBeTruthy();
    await clean();
  },
);

rspackOnlyTest('should create project with biome as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    __dirname,
    'vanilla',
    {
      name: 'test-temp-eslint',
      tools: ['biome'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies['@biomejs/biome']).toBeTruthy();
  expect(existsSync(join(dir, 'biome.json'))).toBeTruthy();
  await clean();
});
