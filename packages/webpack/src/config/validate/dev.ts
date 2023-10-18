import { sharedDevConfigSchema, z } from '@rsbuild/shared';
import type { DevConfig } from '../../types';

export const devConfigSchema: z.ZodType<DevConfig> = sharedDevConfigSchema;
