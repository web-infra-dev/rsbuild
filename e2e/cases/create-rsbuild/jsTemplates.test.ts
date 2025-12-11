import { expect, rspackTest } from '@e2e/helper';
import { createAndValidate } from './helper';

rspackTest('should create react project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'react');
  expect(pkgJson.dependencies.react).toBeTruthy();
  expect(pkgJson.dependencies['react-dom']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});

rspackTest('should create react18 project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'react18');
  expect(pkgJson.dependencies.react.startsWith('^18')).toBeTruthy();
  expect(pkgJson.dependencies['react-dom'].startsWith('^18')).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});

rspackTest('should create preact project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'preact');
  expect(pkgJson.dependencies.preact).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-preact']).toBeTruthy();
});

rspackTest('should create vue3 project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'vue3');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue']).toBeTruthy();
});

rspackTest('should create vue2 project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'vue2');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue2']).toBeTruthy();
});

rspackTest('should create lit project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'lit');
  expect(pkgJson.dependencies.lit).toBeTruthy();
});

rspackTest('should create solid project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'solid');
  expect(pkgJson.dependencies['solid-js']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-solid']).toBeTruthy();
});

rspackTest('should create svelte project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'svelte');
  expect(pkgJson.dependencies.svelte).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-svelte']).toBeTruthy();
});
