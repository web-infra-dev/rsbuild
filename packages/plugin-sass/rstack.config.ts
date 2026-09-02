import { esmConfig } from '@scripts/config/lib';
import { baseConfig } from '@scripts/config/test';
import { define } from 'rstack';

define.lib({
  ...esmConfig,
  output: {
    ...esmConfig.output,
    externals: /[\\/]compiled[\\/]/,
  },
});

define.test(baseConfig);
