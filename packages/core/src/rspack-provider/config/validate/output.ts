import { sharedOutputConfigSchema, z } from '@rsbuild/shared';
import type { OutputConfig } from '../../types';

export const outputConfigSchema: z.ZodType<OutputConfig> =
  sharedOutputConfigSchema
    .extend({
      polyfill: z.enum(['entry', 'ua', 'off']),
    })
    .partial();
