import { describe, it, expect } from 'vitest';
import path from 'path';
import os from 'os';
import qs from 'querystring';
import { getSDK } from '@rsbuild/doctor-core/plugins';
import { createRsbuildDoctorPlugin } from '../test-utils';
import { compileByWebpack5 } from '@rsbuild/test-helper';

describe('test src/loaders/proxy.ts', () => {
  const file = path.resolve(__dirname, '../fixtures/a.js');
  const loaderPath = path.resolve(
    __dirname,
    '../fixtures/loaders/serialize-query-to-comment.js',
  );

  async function webpack5(query?: string) {
    const res = await compileByWebpack5(query ? `${file}${query}` : file, {
      module: {
        rules: [
          {
            test: /\.js$/,
            use: [
              {
                loader: loaderPath,
              },
            ],
          },
        ],
      },
      // @ts-ignore
      plugins: [createRsbuildDoctorPlugin()],
    });
    return res;
  }

  describe('webpack5', () => {
    it('query is undefined', async () => {
      const codeTransformed =
        os.EOL === '\n'
          ? `console.log('a');\n\n// ${JSON.stringify('')}`
          : `console.log('a');\r\n\n// ${JSON.stringify('')}`;

      await webpack5();

      const { loader } = getSDK().getStoreData();
      expect(loader).toHaveLength(1);
      os.EOL === '\n' &&
        expect(loader[0].loaders[0].result).toEqual(codeTransformed);
    });

    it('query exists', async () => {
      // number are not parsed: https://github.com/webpack/loader-utils/tree/v2.0.0-branch#parsequery
      const query = { test: '111' };
      const querystring = `?${qs.stringify(query)}`;
      const codeTransformed =
        os.EOL === '\n'
          ? `console.log('a');\n\n// ${JSON.stringify(
              querystring,
            )}\n// ${JSON.stringify(query)}`
          : `console.log('a');\r\n\n// ${JSON.stringify(
              querystring,
            )}\n// ${JSON.stringify(query)}`;

      await webpack5(querystring);

      const { loader } = getSDK().getStoreData();
      expect(loader).toHaveLength(1);
      expect(loader[0].loaders[0].result).toEqual(codeTransformed);
    });
  });
});
