import { define } from 'rstack';
import { defineConfig } from 'rstack/lint';
import skillsLock from './skills-lock.json' with { type: 'json' };

define.fmt({
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
    ...Object.keys(skillsLock.skills).map((name) => `.agents/skills/${name}`),
  ],
  plugins: ['heading-case'],
});

define.staged({
  '*.{md,mdx,json,css,less,scss}': 'rs fmt',
  '*.{js,jsx,ts,tsx,mjs,cjs}': ['rs lint --type-check', 'rs fmt'],
});

define.lint(({ globalIgnores, importPlugin, js, rstestPlugin, ts }) =>
  defineConfig([
    globalIgnores([
      'e2e/cases/browser-logs/skip-build-error/src/index.js',
      'e2e/cases/wasm/wasm-source-import/src/index.js',
    ]),
    js.configs.recommended,
    importPlugin.configs.recommended,
    ts.configs.recommendedTypeChecked,
    {
      files: ['**/*.test.{ts,tsx}'],
      ...rstestPlugin.configs.recommended,
    },
    {
      plugins: ['unicorn'],
      languageOptions: {
        parserOptions: {
          projectService: true,
        },
      },
      rules: {
        // Re-enable these rules in follow-up PRs after addressing existing reports.
        'import/no-unresolved': 'off',
        'import/named': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-named-as-default': 'off',
        'import/no-duplicates': 'off',
        '@typescript-eslint/await-thenable': 'off',
        'unicorn/prefer-array-some': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      // Templates lack installed dependencies, and e2e sources include intentional
      // syntax fixtures. Keep ordinary lint rules without requiring type information.
      files: ['packages/create-rsbuild/template-*/**', 'e2e/cases/**/src/**'],
      // This source is explicitly included in the shared e2e TypeScript project.
      ignores: ['e2e/cases/javascript-api/server-custom-message/src/**/*.ts'],
      languageOptions: {
        parserOptions: {
          projectService: false,
          project: false,
        },
      },
    },
  ])
    .flat()
    .map((config) => ({
      ...config,
      // Resolve lint globs and project paths from the repository in every invocation.
      basePath: import.meta.dirname,
    })),
);
