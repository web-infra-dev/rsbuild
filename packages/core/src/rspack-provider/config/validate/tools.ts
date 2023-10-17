import {
  z,
  FileFilterUtilSchema,
  sharedToolsConfigSchema,
} from '@rsbuild/shared';
import type { ToolsConfig } from '../../types';

export const toolsConfigSchema: z.ZodType<ToolsConfig> =
  sharedToolsConfigSchema.extend({
    sass: z.chained(z.any(), z.object({ addExcludes: FileFilterUtilSchema })),
    less: z.chained(z.any(), z.object({ addExcludes: FileFilterUtilSchema })),
    htmlPlugin: z.chained(
      z.any(),
      z.object({ entryName: z.string(), entryValue: z.any() }),
    ),
    postcss: z.chained(z.any(), z.object({ addPlugins: z.function() })),
    autoprefixer: z.chained(z.any()),
    rspack: z.chained(z.any(), z.any()),
  });
