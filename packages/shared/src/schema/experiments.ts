import { SharedExperimentsConfig } from '../types';
import { z } from '../utils';

export const sharedExperimentsConfigSchema = z.partialObj({
  lazyCompilation: z.union([
    z.boolean(),
    z.object({ entries: z.boolean(), imports: z.boolean() }),
  ]),
});

const _schema: z.ZodType<SharedExperimentsConfig> =
  sharedExperimentsConfigSchema;
