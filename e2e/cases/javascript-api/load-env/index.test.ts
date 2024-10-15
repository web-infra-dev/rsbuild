import { rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { loadEnv } from '@rsbuild/core';

rspackOnlyTest('should load env files correctly', () => {
  const env = loadEnv({
    cwd: __dirname,
    mode: 'staging',
    prefixes: ['REACT_'],
  });

  expect(process.env.REACT_NAME).toEqual('react');

  expect(env.parsed).toEqual({
    REACT_EMPTY_STRING: '',
    REACT_NAME: 'react',
    REACT_VERSION: '18',
    VUE_NAME: 'vue',
    VUE_VERSION: '3',
  });

  expect(env.publicVars).toEqual({
    'import.meta.env.REACT_EMPTY_STRING': '""',
    'import.meta.env.REACT_NAME': '"react"',
    'import.meta.env.REACT_VERSION': '"18"',
    'process.env.REACT_EMPTY_STRING': '""',
    'process.env.REACT_NAME': '"react"',
    'process.env.REACT_VERSION': '"18"',
  });

  expect(env.rawPublicVars).toEqual({
    REACT_EMPTY_STRING: '',
    REACT_NAME: 'react',
    REACT_VERSION: '18',
  });

  expect(env.filePaths.find((item) => item.endsWith('.env'))).toBeTruthy();
  expect(
    env.filePaths.find((item) => item.endsWith('.env.staging')),
  ).toBeTruthy();

  env.cleanup();
  expect(process.env.REACT_NAME).toEqual(undefined);
});
