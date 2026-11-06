import { define } from 'rstack';
import skillsLock from './skills-lock.json' with { type: 'json' };

define.test({
  pool: 'vmForks',
  projects: ['./packages/*/rstack.config.ts'],
});

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
    // Preserve charset attribute syntax in regression fixtures.
    'e2e/cases/html/meta/src/{unquoted,spaced}.html',
    // Ignore installed Skills because their formatting may differ from this repository.
    ...Object.keys(skillsLock.skills).map((name) => `.agents/skills/${name}`),
  ],
  plugins: ['heading-case'],
});

define.staged({
  '*.{md,mdx,json,css,less,scss}': 'rs fmt',
  '*.{js,jsx,ts,tsx,mjs,cjs}': ['rs lint --type-check', 'rs fmt'],
});

define.lint(({ globalIgnores, importPlugin, js, rstestPlugin, ts }) => [
  globalIgnores([
    'e2e/cases/browser-logs/skip-build-error/src/index.js',
    'e2e/cases/wasm/wasm-source-import/src/index.js',
  ]),
  js.configs.recommended,
  ts.configs.recommendedTypeChecked,
  importPlugin.configs.recommended,
  {
    files: ['e2e/**', 'examples/**', 'packages/create-rsbuild/template-*/**'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
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
      'unicorn/prefer-array-some': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Templates lack installed dependencies, and e2e sources include intentional
    // syntax fixtures. Keep ordinary lint rules without requiring type information.
    files: ['packages/create-rsbuild/template-*/**', 'e2e/cases/**/src/**'],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
]);
