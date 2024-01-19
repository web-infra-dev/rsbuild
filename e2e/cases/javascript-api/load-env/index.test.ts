import { expect } from '@playwright/test';
import { rspackOnlyTest } from '../../../scripts/helper';
import { loadEnv } from '@rsbuild/core';

rspackOnlyTest('should load env files correctly', () => {
  const env = loadEnv({
    cwd: __dirname,
    mode: 'staging',
    prefixes: ['REACT_'],
  });

  expect(process.env.REACT_NAME).toEqual('react');

  expect(env.parsed).toEqual({
    REACT_NAME: 'react',
    REACT_VERSION: '18',
    VUE_NAME: 'vue',
    VUE_VERSION: '3',
  });

  expect(env.publicVars).toEqual({
    'process.env.REACT_NAME': '"react"',
    'process.env.REACT_VERSION': '"18"',
  });

  expect(env.filePaths.find((item) => item.endsWith('.env'))).toBeTruthy();
  expect(
    env.filePaths.find((item) => item.endsWith('.env.staging')),
  ).toBeTruthy();

  env.cleanup();
  expect(process.env.REACT_NAME).toEqual(undefined);
});
