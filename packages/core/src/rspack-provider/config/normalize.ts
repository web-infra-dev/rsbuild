import { mergeRsbuildConfig } from '@rsbuild/shared';
import { RsbuildConfig, NormalizedConfig } from '../../types';
import { createDefaultConfig } from './defaults';

/** #__PURE__
 * 1. May used by multiple plugins.
 * 2. Object value that should not be empty.
 * 3. Meaningful and can be filled by constant value.
 */
export const normalizeConfig = (config: RsbuildConfig): NormalizedConfig =>
  mergeRsbuildConfig<NormalizedConfig>(
    createDefaultConfig() as NormalizedConfig,
    config as NormalizedConfig,
  );
