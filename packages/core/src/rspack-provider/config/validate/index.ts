import { z } from '@rsbuild/shared/zod';
import { validateRsbuildConfig as validateConfig } from '@rsbuild/shared';
import { RsbuildConfig } from '../../types';

import { devConfigSchema } from './dev';
import { htmlConfigSchema } from './html';
import { outputConfigSchema } from './output';
import { performanceConfigSchema } from './performance';
import { sourceConfigSchema } from './source';
import { toolsConfigSchema } from './tools';
import { securityConfigSchema } from './security';

export const configSchema: z.ZodType<RsbuildConfig> = z.partialObj({
  source: sourceConfigSchema,
  dev: devConfigSchema,
  html: htmlConfigSchema,
  output: outputConfigSchema,
  security: securityConfigSchema,
  performance: performanceConfigSchema,
  tools: toolsConfigSchema,
});

export const validateRsbuildConfig = async (data: unknown) => {
  return validateConfig(configSchema, data);
};
