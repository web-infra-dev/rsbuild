import { define } from 'rstack';

define.test(async () => {
  const { baseConfig } = await import('@scripts/config/rstest.config.ts');
  const { withRslibConfig } = await import('@rstest/adapter-rslib');

  return {
    ...baseConfig,
    extends: withRslibConfig(),
  };
});
