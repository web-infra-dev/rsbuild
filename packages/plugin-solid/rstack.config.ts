import { define } from 'rstack';

define.lib(async () => {
  const { esmConfig, nodeMinifyConfig } = await import('@scripts/config/lib');

  return {
    lib: [
      esmConfig,
      {
        format: 'cjs',
        syntax: 'es2023',
        output: {
          minify: nodeMinifyConfig,
        },
      },
    ],
  };
});

define.test(async () => {
  const { baseConfig } = await import('@scripts/config/test');

  return baseConfig;
});
