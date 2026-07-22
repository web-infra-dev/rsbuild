import { define } from 'rstack';

define.lint(async () => {
  const { globalIgnores, js, ts } = await import('rstack/lint');

  return [
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
  ];
});
