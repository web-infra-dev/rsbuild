import { define } from 'rstack';

define.lib(async () => {
  const { esmConfig } = await import('@scripts/config/lib');

  return {
    lib: [
      esmConfig,
      {
        source: {
          entry: {
            refreshLoader: './src/refreshLoader.ts',
            solidLoader: './src/solidLoader.ts',
          },
        },
        output: {
          filename: {
            js: '[name].mjs',
          },
        },
      },
    ],
  };
});

define.test(async () => {
  const { baseConfig } = await import('@scripts/config/test');

  return baseConfig;
});
