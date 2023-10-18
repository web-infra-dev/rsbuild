import { sharedHtmlConfigSchema, z } from '@rsbuild/shared';
import type { HtmlConfig } from '../../types';

export const htmlConfigSchema: z.ZodType<HtmlConfig> = sharedHtmlConfigSchema;
