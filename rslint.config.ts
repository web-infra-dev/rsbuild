import { defineConfig, ts } from '@rslint/core';

export default defineConfig([
  { ignores: ['**/dist/**', '**/dist-types/**', '**/compiled/**'] },
  ts.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: ['./packages/*/tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
