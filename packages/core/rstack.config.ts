import { define } from 'rstack';

define.test(async () => {
  const [{ baseConfig }, { withRslibConfig }] = await Promise.all([
    import('@scripts/config/rstest.config.ts'),
    import('@rstest/adapter-rslib'),
  ]);

  return {
    ...baseConfig,
    extends: withRslibConfig(),
  };
});
