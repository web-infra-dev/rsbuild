import { pluginImageCompress } from '@rsbuild/plugin-image-compress';

export default {
  plugins: [pluginImageCompress(['jpeg', 'png', 'ico', 'svg'])],
};
