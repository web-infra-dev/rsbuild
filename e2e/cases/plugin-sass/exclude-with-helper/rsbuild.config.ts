import { pluginSass } from '@rsbuild/plugin-sass';

export default {
  plugins: [
    pluginSass({
      sassLoaderOptions: (_, { addExcludes }) => {
        addExcludes([/b\.scss$/]);
      },
    }),
  ],
};
