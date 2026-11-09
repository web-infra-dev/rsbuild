import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';

export default {
  // TODO: Re-enable build cache when changes to CSS Modules options invalidate cached modules.
  performance: { buildCache: false },
  plugins: [pluginLess(), pluginSass()],
};
