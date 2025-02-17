import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createAndValidate } from './helper';

rspackOnlyTest('should create react project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'react');
  expect(pkgJson.dependencies.react).toBeTruthy();
  expect(pkgJson.dependencies['react-dom']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-react']).toBeTruthy();
});

rspackOnlyTest('should create preact project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'preact');
  expect(pkgJson.dependencies.preact).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-preact']).toBeTruthy();
});

rspackOnlyTest('should create vue3 project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'vue3');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue']).toBeTruthy();
});

rspackOnlyTest('should create vue2 project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'vue2');
  expect(pkgJson.dependencies.vue).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-vue2']).toBeTruthy();
});

rspackOnlyTest('should create lit project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'lit');
  expect(pkgJson.dependencies.lit).toBeTruthy();
});

rspackOnlyTest('should create solid project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'solid');
  expect(pkgJson.dependencies['solid-js']).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-solid']).toBeTruthy();
});

rspackOnlyTest('should create svelte project as expected', async () => {
  const { pkgJson } = await createAndValidate(import.meta.dirname, 'svelte');
  expect(pkgJson.dependencies.svelte).toBeTruthy();
  expect(pkgJson.devDependencies['@rsbuild/plugin-svelte']).toBeTruthy();
});
