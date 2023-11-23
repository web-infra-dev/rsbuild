import { expect, test } from '@playwright/test';
import { getSDK } from '@rsbuild/doctor-core/plugins';
import { compileByWebpack5 } from '@rsbuild/test-helper';
import os from 'os';
import path from 'path';
import { createRsbuildDoctorPlugin } from '../test-utils';

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
          oneOf: [
            {
              test: /\.js$/,
              loader: loaderPath,
            },
          ],
          use: [],
        },
      ],
    },
    // @ts-ignore
    plugins: [createRsbuildDoctorPlugin()],
  });
  return res;
}

test('webpack5 loader rule.use maybe empty array with oneOf', async () => {
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
