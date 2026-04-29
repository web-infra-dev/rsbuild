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

test('should create React project with Rslint as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'react-ts',
    {
      name: 'test-temp-react-rslint',
      tools: ['rslint'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies['@rslint/core']).toBeTruthy();

  const configFile = join(dir, 'rslint.config.ts');
  expect(existsSync(configFile)).toBeTruthy();

  const configContent = readFileSync(configFile, 'utf-8');
  expect(
    configContent.includes('reactPlugin.configs.recommended'),
  ).toBeTruthy();
  expect(configContent.includes('ts.configs.recommended')).toBeTruthy();
  await clean();
});

test('should create Vue project with vanilla Rslint as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'vue-js',
    {
      name: 'test-temp-vue-rslint',
      tools: ['rslint'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies['@rslint/core']).toBeTruthy();

  const configFile = join(dir, 'rslint.config.ts');
  expect(existsSync(configFile)).toBeTruthy();

  const configContent = readFileSync(configFile, 'utf-8');
  expect(configContent.includes('js.configs.recommended')).toBeTruthy();
  expect(configContent.includes('reactPlugin')).toBeFalsy();
  expect(configContent.includes('ts.configs.recommended')).toBeFalsy();
  await clean();
});

test('should create Vue project with ESLint as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'vue-ts',
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

test('should create React project with react-compiler as expected', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'react',
    {
      name: 'test-temp-react-compiler',
      tools: ['react-compiler'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies['@rsbuild/plugin-babel']).toBeTruthy();
  expect(pkgJson.devDependencies['babel-plugin-react-compiler']).toBeTruthy();
  expect(pkgJson.dependencies['react-compiler-runtime']).toBeFalsy();

  const configFile = join(dir, 'rsbuild.config.js');
  expect(existsSync(configFile)).toBeTruthy();

  const configContent = readFileSync(configFile, 'utf-8');
  expect(configContent.includes('pluginBabel({')).toBeTruthy();
  expect(configContent.includes('include: /\\.[jt]sx?$/')).toBeTruthy();
  expect(
    configContent.includes('exclude: [/[\\\\/]node_modules[\\\\/]/]'),
  ).toBeTruthy();
  expect(configContent.includes("'babel-plugin-react-compiler'")).toBeTruthy();
  await clean();
});

test('should ignore react-compiler for non-React projects', async () => {
  const { dir, pkgJson, clean } = await createAndValidate(
    import.meta.dirname,
    'vanilla',
    {
      name: 'test-temp-vanilla-react-compiler',
      tools: ['react-compiler'],
      clean: false,
    },
  );
  expect(pkgJson.devDependencies['@rsbuild/plugin-babel']).toBeFalsy();
  expect(pkgJson.devDependencies['babel-plugin-react-compiler']).toBeFalsy();
  expect(pkgJson.dependencies?.['react-compiler-runtime']).toBeFalsy();

  const configFile = join(dir, 'rsbuild.config.js');
  expect(existsSync(configFile)).toBeTruthy();

  const configContent = readFileSync(configFile, 'utf-8');
  expect(configContent.includes('pluginBabel')).toBeFalsy();
  expect(configContent.includes('react-compiler')).toBeFalsy();
  await clean();
});
