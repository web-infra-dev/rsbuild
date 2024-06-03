import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';

export default {
  plugins: [pluginLess(), pluginSass(), pluginTypedCSSModules()],
  output: {
    cssModules: {
      namedExport: true,
    },
  },
};
