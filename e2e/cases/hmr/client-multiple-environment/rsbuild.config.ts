import { join } from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  environments: {
    foo: {
      source: {
        entry: {
          foo: join(__dirname, 'foo.js'),
        },
      },
      dev: {
        client: {
          host: 'http://foo.com',
        },
      },
    },
    bar: {
      source: {
        entry: {
          bar: join(__dirname, 'bar.js'),
        },
      },
      dev: {
        client: {
          host: 'http://bar.com',
        },
      },
    },
  },
});
