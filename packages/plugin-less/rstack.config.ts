import { define } from 'rstack';

define.lib(async () => {
  const { esmConfig } = await import('@scripts/config/lib');

  return {
    ...esmConfig,
    output: {
      ...esmConfig.output,
      externals: /[\\/]compiled[\\/]/,
    },
  };
});

define.test(async () => {
  const { baseConfig } = await import('@scripts/config/test');

  return baseConfig;
});
