import { RsbuildTarget, MainFields, SharedSourceConfig } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const RsbuildTargetSchema: ZodType<RsbuildTarget> = z.enum([
  'web',
  'node',
  'web-worker',
  'service-worker',
]);

export const MainFieldsSchema: ZodType<MainFields> = z.array(
  z.arrayOrNot(z.string()),
);

export const sharedSourceConfigSchema = z.partialObj({
  alias: z.chained(z.record(z.arrayOrNot(z.string()))),
  aliasStrategy: z.enum(['prefer-tsconfig', 'prefer-alias']),
  include: z.array(z.union([z.string(), z.instanceof(RegExp)])),
  exclude: z.array(z.union([z.string(), z.instanceof(RegExp)])),
  preEntry: z.arrayOrNot(z.string()),
  globalVars: z.chained(z.any(), z.any()),
  compileJsDataURI: z.boolean(),
  resolveMainFields: z.union([
    MainFieldsSchema,
    z.record(RsbuildTargetSchema, MainFieldsSchema),
  ]),
  resolveExtensionPrefix: z.union([
    z.string(),
    z.record(RsbuildTargetSchema, z.string()),
  ]),
});

const _schema: z.ZodType<SharedSourceConfig> = sharedSourceConfigSchema;
