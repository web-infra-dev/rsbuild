import { sharedOutputConfigSchema, z } from '@rsbuild/shared';
import type { OutputConfig } from '../../types';

export const outputConfigSchema: z.ZodType<OutputConfig> =
  sharedOutputConfigSchema;
