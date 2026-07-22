import { define } from 'rstack';

define.test(async () => {
  // Disable color in test.
  process.env.NO_COLOR = '1';

  const { withRslibConfig } = await import('@rstest/adapter-rslib');

  return {
    extends: withRslibConfig({
      configPath: './packages/core/rslib.config.ts',
    }),
    output: {
      externals: ['@rsbuild/core'],
    },
    name: 'node',
    globals: true,
    restoreMocks: true,
    unstubEnvs: true,
    include: ['packages/**/*.test.ts'],
    exclude: ['packages/create-rsbuild/template-rstest'],
    setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
  };
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
