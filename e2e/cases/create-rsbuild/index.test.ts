import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createAndValidate } from './helper';

rspackOnlyTest('should create vanilla project as expected', async () => {
  createAndValidate(__dirname, 'vanilla');
});

rspackOnlyTest('should create vanilla-ts project as expected', async () => {
  createAndValidate(__dirname, 'vanilla-ts');
});

rspackOnlyTest('should create react project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'react');
  expect(pkgJson.dependencies.react).toBeTruthy();
  expect(pkgJson.dependencies['react-dom']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});

rspackOnlyTest('should create react-ts project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'react-ts');
  expect(pkgJson.dependencies.react).toBeTruthy();
  expect(pkgJson.dependencies['react-dom']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});

rspackOnlyTest('should create preact project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'preact');
  expect(pkgJson.dependencies.preact).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-preact']).toBeTruthy();
});

rspackOnlyTest('should create preact-ts project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'preact-ts');
  expect(pkgJson.dependencies.preact).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-preact']).toBeTruthy();
});

rspackOnlyTest('should create vue3 project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'vue3');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue']).toBeTruthy();
});

rspackOnlyTest('should create vue3-ts project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'vue3-ts');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue']).toBeTruthy();
});

rspackOnlyTest('should create vue2 project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'vue2');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue2']).toBeTruthy();
});

rspackOnlyTest('should create vue2-ts project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'vue2-ts');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue2']).toBeTruthy();
});

rspackOnlyTest('should create lit project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'lit');
  expect(pkgJson.dependencies.lit).toBeTruthy();
});

rspackOnlyTest('should create lit-ts project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'lit-ts');
  expect(pkgJson.dependencies.lit).toBeTruthy();
});

rspackOnlyTest('should create solid project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'solid');
  expect(pkgJson.dependencies['solid-js']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-solid']).toBeTruthy();
});

rspackOnlyTest('should create solid-ts project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'solid-ts');
  expect(pkgJson.dependencies['solid-js']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-solid']).toBeTruthy();
});

rspackOnlyTest('should create svelte project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'svelte');
  expect(pkgJson.dependencies.svelte).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-svelte']).toBeTruthy();
});

rspackOnlyTest('should create svelte-ts project as expected', async () => {
  const { pkgJson } = createAndValidate(__dirname, 'svelte-ts');
  expect(pkgJson.dependencies.svelte).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-svelte']).toBeTruthy();
});

rspackOnlyTest('should allow to create project in sub dir', async () => {
  createAndValidate(__dirname, 'vanilla', {
    name: 'test-temp-dir/rsbuild-project',
  });
});

rspackOnlyTest('should allow to create project in relative dir', async () => {
  createAndValidate(__dirname, 'vanilla', {
    name: './test-temp-relative-dir',
  });
});

rspackOnlyTest('should create project with eslint as expected', async () => {
  const { dir, pkgJson, clean } = createAndValidate(__dirname, 'vanilla', {
    name: 'test-temp-eslint',
    tools: ['eslint'],
    clean: false,
  });
  expect(pkgJson.devDependencies.eslint).toBeTruthy();
  expect(existsSync(join(dir, 'eslint.config.mjs'))).toBeTruthy();
  clean();
});

rspackOnlyTest('should create project with prettier as expected', async () => {
  const { dir, pkgJson, clean } = createAndValidate(__dirname, 'vanilla', {
    name: 'test-temp-prettier',
    tools: ['prettier'],
    clean: false,
  });
  expect(pkgJson.devDependencies.prettier).toBeTruthy();
  expect(existsSync(join(dir, '.prettierrc'))).toBeTruthy();
  clean();
});

rspackOnlyTest(
  'should create project with eslint and prettier as expected',
  async () => {
    const { dir, pkgJson, clean } = createAndValidate(__dirname, 'vanilla', {
      name: 'test-temp-eslint-prettier',
      tools: ['eslint', 'prettier'],
      clean: false,
    });
    expect(pkgJson.devDependencies.eslint).toBeTruthy();
    expect(pkgJson.devDependencies.prettier).toBeTruthy();
    expect(existsSync(join(dir, '.prettierrc'))).toBeTruthy();
    expect(existsSync(join(dir, 'eslint.config.mjs'))).toBeTruthy();
    clean();
  },
);

rspackOnlyTest('should create project with biome as expected', async () => {
  const { dir, pkgJson, clean } = createAndValidate(__dirname, 'vanilla', {
    name: 'test-temp-eslint',
    tools: ['biome'],
    clean: false,
  });
  expect(pkgJson.devDependencies['@biomejs/biome']).toBeTruthy();
  expect(existsSync(join(dir, 'biome.json'))).toBeTruthy();
  clean();
});
