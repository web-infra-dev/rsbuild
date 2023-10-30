import { sharedExperimentsConfigSchema, z } from '@rsbuild/shared';
import type { ExperimentsConfig } from '../../types';

export const experimentsConfigSchema: z.ZodType<ExperimentsConfig> =
  sharedExperimentsConfigSchema;
