import { baseConfig } from '@scripts/config/rstest.config.ts';
import { withRslibConfig } from '@rstest/adapter-rslib';

export default {
  ...baseConfig,
  extends: withRslibConfig(),
};
