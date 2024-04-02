import type { RsbuildPlugin } from '@rsbuild/core';

export const myPlugin: RsbuildPlugin = {
  name: 'my-plugin',
  setup(api) {
    api.transform(
      ({ code }) => {
        return code.replace('red', 'blue');
      },
      { test: /\.css$/ },
    );

    api.transform(
      ({ code }) => {
        return {
          code: code.replace('hello', 'world'),
        };
      },
      { test: /\.js$/ },
    );
  },
};
