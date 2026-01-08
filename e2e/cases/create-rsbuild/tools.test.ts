import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@e2e/helper';
import { createAndValidate } from './helper';

test('should create project with eslint as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
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

test('should create project with prettier as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
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

test('should create project with tailwindcss as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'vanilla',
    {
      name: 'test-temp-tailwindcss',
      tools: ['tailwindcss'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies.tailwindcss).toBeTruthy();
  expect(pkgJson.devDependencies['@tailwindcss/postcss']).toBeTruthy();
  expect(existsSync(join(dir, 'postcss.config.mjs'))).toBeTruthy();

  const cssFile = join(dir, 'src/index.css');
  expect(existsSync(cssFile)).toBeTruthy();
  const cssContent = readFileSync(cssFile, 'utf-8');
  expect(cssContent.includes("@import 'tailwindcss';")).toBeTruthy();
  await clean();
});

test('should create React project with tailwindcss as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'react',
    {
      name: 'test-temp-tailwindcss',
      tools: ['tailwindcss'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies.tailwindcss).toBeTruthy();
  expect(pkgJson.devDependencies['@tailwindcss/postcss']).toBeTruthy();
  expect(existsSync(join(dir, 'postcss.config.mjs'))).toBeTruthy();
  const cssFile = join(dir, 'src/App.css');
  expect(existsSync(cssFile)).toBeTruthy();
  const cssContent = readFileSync(cssFile, 'utf-8');
  expect(cssContent.includes("@import 'tailwindcss';")).toBeTruthy();
  await clean();
});

test('should create project with ESLint and prettier as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
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
});

test('should create React project with ESLint as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'react-ts',
    {
      name: 'test-temp-react-eslint',
      tools: ['eslint'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies.eslint).toBeTruthy();
  expect(pkgJson.devDependencies['eslint-plugin-react-hooks']).toBeTruthy();
  expect(existsSync(join(dir, 'eslint.config.mjs'))).toBeTruthy();
  await clean();
});

test('should create Vue project with ESLint as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'vue3-ts',
    {
      name: 'test-temp-vue-eslint',
      tools: ['eslint'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies.eslint).toBeTruthy();
  expect(pkgJson.devDependencies['eslint-plugin-vue']).toBeTruthy();
  expect(existsSync(join(dir, 'eslint.config.mjs'))).toBeTruthy();
  await clean();
});

test('should create project with biome as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
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
