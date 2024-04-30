import { pluginReact } from '@rsbuild/plugin-react';

export default {
  plugins: [pluginReact()],
  performance: {
    preconnect: [
      {
        href: 'http://aaaa.com',
      },
      {
        href: 'http://bbbb.com',
        crossorigin: true,
      },
    ],
  },
};
