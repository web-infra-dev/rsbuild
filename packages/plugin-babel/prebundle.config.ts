import type { Config } from 'prebundle';

export default {
  prettier: true,
  dependencies: [
    {
      name: 'babel-loader',
      ignoreDts: true,
      externals: {
        '@babel/core': '@babel/core',
      },
    },
  ],
} satisfies Config;
