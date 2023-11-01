import {
  z,
  FileFilterUtilSchema,
  sharedToolsConfigSchema,
} from '@rsbuild/shared';
import type { ToolsConfig } from '../../types';

export const toolsConfigSchema: z.ZodType<ToolsConfig> = sharedToolsConfigSchema
  .extend({
    terser: z.chained(z.any()),
    tsLoader: z.chained(
      z.any(),
      z.object({
        addIncludes: z.string(),
        addExcludes: FileFilterUtilSchema,
      }),
    ),
    htmlPlugin: z.chained(
      z.any(),
      z.object({ entryName: z.string(), entryValue: z.any() }),
    ),
    cssExtract: z.partialObj({
      pluginOptions: z.any(),
      loaderOptions: z.any(),
    }),
    webpack: z.chained(z.any(), z.any()),
    webpackChain: z.arrayOrNot(z.function()),
    minifyCss: z.chained(z.any()),
  })
  .partial();
