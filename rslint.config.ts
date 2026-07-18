import { defineConfig, globalIgnores, js, ts } from '@rslint/core';

export default defineConfig([
  globalIgnores([
    'e2e/cases/browser-logs/skip-build-error/src/index.js',
    'e2e/cases/wasm/wasm-source-import/src/index.js',
  ]),
  js.configs.recommended,
  ts.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: [
          './packages/*/tsconfig.json',
          './scripts/*/tsconfig.json',
          './examples/*/tsconfig.json',
          './e2e/tsconfig.json',
          './e2e/type-tests/*/tsconfig.json',
        ],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
