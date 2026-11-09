import { pluginSass } from '@rsbuild/plugin-sass';

export default {
  // TODO: Re-enable build cache when cached Sass builds replay loader warnings.
  performance: { buildCache: false },
  plugins: [pluginSass()],
};
