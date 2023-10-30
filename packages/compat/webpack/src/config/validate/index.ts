import { z } from '@rsbuild/shared/zod';
import { RsbuildConfig } from '../../types';
import { validateRsbuildConfig as validateConfig } from '@rsbuild/shared';

import { devConfigSchema } from './dev';
import { experimentsConfigSchema } from './experiments';
import { htmlConfigSchema } from './html';
import { outputConfigSchema } from './output';
import { performanceConfigSchema } from './performance';
import { securityConfigSchema } from './security';
import { sourceConfigSchema } from './source';
import { toolsConfigSchema } from './tools';

export const configSchema: z.ZodType<RsbuildConfig> = z.partialObj({
  source: sourceConfigSchema,
  dev: devConfigSchema,
  html: htmlConfigSchema,
  experiments: experimentsConfigSchema,
  output: outputConfigSchema,
  performance: performanceConfigSchema,
  security: securityConfigSchema,
  tools: toolsConfigSchema,
});

export const validateRsbuildConfig = async (data: unknown) => {
  return validateConfig(configSchema, data);
};
