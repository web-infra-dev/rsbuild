import { expect, rspackOnlyTest } from '@e2e/helper';
import { createAndValidate } from './helper';

rspackOnlyTest('should create react-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'react-ts');
  expect(pkgJson.dependencies.react).toBeTruthy();
  expect(pkgJson.dependencies['react-dom']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});
rspackOnlyTest('should create react18-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'react18-ts');
  expect(pkgJson.dependencies.react.startsWith('^18')).toBeTruthy();
  expect(pkgJson.dependencies['react-dom'].startsWith('^18')).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});

rspackOnlyTest('should create preact-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'preact-ts');
  expect(pkgJson.dependencies.preact).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-preact']).toBeTruthy();
});

rspackOnlyTest('should create vue3-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'vue3-ts');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue']).toBeTruthy();
});

rspackOnlyTest('should create vue2-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'vue2-ts');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue2']).toBeTruthy();
});

rspackOnlyTest('should create lit-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'lit-ts');
  expect(pkgJson.dependencies.lit).toBeTruthy();
});

rspackOnlyTest('should create solid-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'solid-ts');
  expect(pkgJson.dependencies['solid-js']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-solid']).toBeTruthy();
});

rspackOnlyTest('should create svelte-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'svelte-ts');
  expect(pkgJson.dependencies.svelte).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-svelte']).toBeTruthy();
});
