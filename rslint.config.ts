import { defineConfig, ts } from '@rslint/core';

export default defineConfig([
  {
    // Global ignores — entry with only `ignores` excludes matching files from all rules
    ignores: ['**/dist/**', '**/dist-types/**', '**/compiled/**'],
  },
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
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'no-constant-binary-expression': 'off',
    },
  },
]);
