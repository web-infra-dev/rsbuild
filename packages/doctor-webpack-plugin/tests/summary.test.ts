import { getSDK } from '@rsbuild/doctor-core/plugins';
import { Summary } from '@rsbuild/doctor-utils';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { createRsbuildDoctorPlugin } from './test-utils';
import { compileByWebpack5 } from '@rsbuild/test-helper';

describe('test src/plugin.ts summary data reporter', () => {
  async function webpack(compile: typeof compileByWebpack5) {
    const file = path.resolve(__dirname, './fixtures/b.js');
    const loader = path.resolve(__dirname, './fixtures/loaders/comment.js');
    const res = await compile(file, {
      module: {
        rules: [
          {
            test: /\.js/,
            use: loader,
          },
        ],
      },
      optimization: {
        minimize: true,
      },
      plugins: [createRsbuildDoctorPlugin({})],
    });
    return res;
  }

  const costsNames = [
    Summary.SummaryCostsDataName.Bootstrap,
    Summary.SummaryCostsDataName.Compile,
    Summary.SummaryCostsDataName.Done,
    Summary.SummaryCostsDataName.Minify,
  ];

  it('webpack5', async () => {
    await webpack(compileByWebpack5);
    const sdk = getSDK();
    const { configs } = sdk.getStoreData();
    const { costs } = sdk.getStoreData().summary;

    expect(configs[0]).toBeInstanceOf(Object);
    expect(configs[0].name).toEqual('webpack');

    costsNames.forEach((costsName) => {
      expect({
        name: costsName,
        count: costs.filter((e) => e.name === costsName).length,
      }).toStrictEqual({
        name: costsName,
        count: 1,
      });
    });
  });
});
