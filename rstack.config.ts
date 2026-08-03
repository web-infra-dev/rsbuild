import { define } from 'rstack';

define.fmt({
  printWidth: 100,
  singleQuote: true,
  sortPackageJson: true,
  ignorePatterns: [
    // Avoid parser errors in intentionally invalid or unsupported fixtures.
    'e2e/cases/plugin-less/inline-js/src/*.less',
    'e2e/cases/browser-logs/skip-build-error/src/**',
    'e2e/cases/syntax-es/using-declaration/src/index.ts',
    // Preserve uppercase DOCTYPE in create-rsbuild templates.
    'packages/create-rsbuild/**/*.html',
    // Keep the package-manager-generated layout stable.
    'pnpm-lock.yaml',
  ],
});

define.staged({
  '*.{md,mdx,json,css,less,scss}': 'rs fmt',
  '*.{js,jsx,ts,tsx,mjs,cjs}': ['rs lint --type-check', 'rs fmt'],
});

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
