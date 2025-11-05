import { expect, rspackTest } from '@e2e/helper';
import { createAndValidate } from './helper';

rspackTest('should create react-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'react-ts');
  expect(pkgJson.dependencies.react).toBeTruthy();
  expect(pkgJson.dependencies['react-dom']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});

rspackTest('should create react18-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'react18-ts');
  expect(pkgJson.dependencies.react.startsWith('^18')).toBeTruthy();
  expect(pkgJson.dependencies['react-dom'].startsWith('^18')).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});

rspackTest('should create preact-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'preact-ts');
  expect(pkgJson.dependencies.preact).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-preact']).toBeTruthy();
});

rspackTest('should create vue3-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'vue3-ts');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue']).toBeTruthy();
});

rspackTest('should create vue2-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'vue2-ts');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue2']).toBeTruthy();
});

rspackTest('should create lit-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'lit-ts');
  expect(pkgJson.dependencies.lit).toBeTruthy();
});

rspackTest('should create solid-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'solid-ts');
  expect(pkgJson.dependencies['solid-js']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-solid']).toBeTruthy();
});

rspackTest('should create svelte-ts project as expected', async () => {
  const { pkgJson } = await createAndValidate(__dirname, 'svelte-ts');
  expect(pkgJson.dependencies.svelte).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-svelte']).toBeTruthy();
});
