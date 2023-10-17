import { sharedSourceConfigSchema, z } from '@rsbuild/shared';
import type { SourceConfig } from '../../types';

export const sourceConfigSchema: z.ZodType<SourceConfig> =
  sharedSourceConfigSchema
    .extend({
      define: z.record(z.any()),
    })
    .partial();
