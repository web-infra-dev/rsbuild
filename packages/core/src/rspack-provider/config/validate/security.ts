import { sharedSecurityConfigSchema, z } from '@rsbuild/shared';
import type { SecurityConfig } from '../../types';

export const securityConfigSchema: z.ZodType<SecurityConfig> =
  sharedSecurityConfigSchema;
