import { defineConfig, ts } from '@rslint/core';

export default defineConfig([
  ts.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: ['./packages/*/tsconfig.json', './e2e/tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // TODO: Rslint bug
      'prefer-const': 'off',
    },
  },
]);
