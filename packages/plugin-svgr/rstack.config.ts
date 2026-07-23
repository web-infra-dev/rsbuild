import { define } from 'rstack';

define.test(async () => {
  const { baseConfig } = await import('@scripts/config/rstest.config.ts');

  return baseConfig;
});
