import { pluginLess } from '@rsbuild/plugin-less';

export default {
  plugins: [
    pluginLess({
      lessLoaderOptions: (_, { addExcludes }) => {
        addExcludes([/b\.less$/]);
      },
    }),
  ],
};
