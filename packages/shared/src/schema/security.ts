import { SecurityConfig, SriOptions } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const SriOptionsSchema: ZodType<SriOptions> = z.partialObj({
  hashFuncNames: z.array(z.string()).min(1) as unknown as ZodType<
    [string, ...string[]]
  >,
  enabled: z.literals(['auto', true, false]),
  hashLoading: z.enum(['eager', 'lazy']),
});

export const sharedSecurityConfigSchema = z.partialObj({
  nonce: z.string(),
});

const _schema: z.ZodType<SecurityConfig> = sharedSecurityConfigSchema;
