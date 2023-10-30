import { z, sharedToolsConfigSchema } from '@rsbuild/shared';
import type { ToolsConfig } from '../../types';

export const toolsConfigSchema: z.ZodType<ToolsConfig> =
  sharedToolsConfigSchema.extend({
    htmlPlugin: z.chained(
      z.any(),
      z.object({ entryName: z.string(), entryValue: z.any() }),
    ),
    rspack: z.chained(z.any(), z.any()),
  });
