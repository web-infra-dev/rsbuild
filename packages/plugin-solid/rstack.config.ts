import { esmConfig } from '@scripts/config/lib';
import { baseConfig } from '@scripts/config/test';
import { define } from 'rstack';

define.lib(esmConfig);

define.test(baseConfig);
