import { define } from 'rstack';

define.fmt(async () => {
  const { default: skillsLock } = await import('./skills-lock.json', {
    with: { type: 'json' },
  });

  return {
    singleQuote: true,
    sortPackageJson: true,
    ignorePatterns: [
      // Avoid parser errors in intentionally invalid or unsupported fixtures.
      'e2e/cases/plugin-less/inline-js/src/*.less',
      'e2e/cases/browser-logs/skip-build-error/src/**',
      'e2e/cases/syntax-es/using-declaration/src/index.ts',
      // Preserve uppercase DOCTYPE in create-rsbuild templates.
      'packages/create-rsbuild/**/*.html',
      // Ignore installed Skills because their formatting may differ from this repository.
      ...Object.keys(skillsLock.skills).map(
        (name) => `.agents/skills/${name}/**`,
      ),
    ],
    plugins: ['heading-case'],
  };
});

define.staged({
  '*.{md,mdx,json,css,less,scss}': 'rs fmt',
  '*.{js,jsx,ts,tsx,mjs,cjs}': ['rs lint --type-check', 'rs fmt'],
});

define.lint(({ globals, globalIgnores, js, rstestPlugin, ts }) => [
  globalIgnores([
    'e2e/cases/browser-logs/skip-build-error/src/index.js',
    'e2e/cases/wasm/wasm-source-import/src/index.js',
  ]),
  js.configs.recommended,
  ts.configs.recommendedTypeChecked,
  {
    files: ['**/*.test.{ts,tsx}'],
    ...rstestPlugin.configs.recommended,
  },
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.nodeBuiltin,
        __dirname: 'readonly',
        __filename: 'readonly',
        CONFIG_VALUE: 'readonly',
        CONTENT: 'readonly',
        DEFINED_VALUE: 'readonly',
        ENABLE_TEST: 'readonly',
        undefinedValue: 'readonly',
      },
    },
  },
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
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
